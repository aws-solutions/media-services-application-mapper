# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
"""
This Lambda is responsible for receiving and storing CloudWatch events
originating from Media Services. This Lambda must be installed into
each region where Media Services are created.
"""

import datetime
import os
import json
from random import randint
from urllib.parse import unquote

import boto3
from botocore.exceptions import ClientError
from jsonpath_ng import parse

DYNAMO_RESOURCE = boto3.resource('dynamodb', region_name=os.environ["EVENTS_TABLE_REGION"])
DYNAMO_TABLE = DYNAMO_RESOURCE.Table(os.environ["EVENTS_TABLE_NAME"])
CLOUDWATCH_EVENTS_TABLE_NAME = DYNAMO_RESOURCE.Table(os.environ["CLOUDWATCH_EVENTS_TABLE_NAME"])


def lambda_handler(event, _):
    """
    Entry point for CloudWatch event receipt.
    """
    try:
        item = {}
        print(event)
        item["timestamp"] = int(datetime.datetime.strptime(
            event["time"], '%Y-%m-%dT%H:%M:%SZ').timestamp())
        item["expires"] = item["timestamp"] + int(os.environ["ITEM_TTL"])
        # give timestamp a millisecond precision
        item["timestamp"] = item["timestamp"] * 1000 + randint(1, 999)
        item["data"] = json.dumps(event["detail"])
        item["type"] = event["detail-type"]
        if "eventName" in event["detail"]:
            item["type"] = item["type"] + ": " + event["detail"]["eventName"]

        # catch all the various forms of ARN from the media services
        arn_expr = parse('$..arn|aRN|resource-arn|channel_arn|multiplex_arn|flow_arn|flowArn|PlaybackConfigurationArn|resourceArn')
        original_arns = [match.value for match in arn_expr.find(event)]
        arns = []
        # remove arn that is for userIdentity or inputSecurityGroup
        # note: can't remove an item from a list that's being iterated over so doing it this way instead =P
        for arn in original_arns:
            if "user" in arn or "role" in arn or "inputSecurityGroup" in arn:
                pass
            else:
                arns.append(arn)
        if arns:
            item["resource_arn"] = unquote(arns[0])

        if event["source"] == "aws.medialive":
            # handle medialive pipeline alerts
            if "MediaLive" in event["detail-type"] and "Alert" in event["detail-type"]:
                # multiplex pipeline alerts do not have a "detail.channel_arn" property.
                if "Multiplex" in event["detail-type"]:
                    event["resource_arn"] = event["detail"]["multiplex_arn"]
                else:
                    event["resource_arn"] = event["detail"]["channel_arn"]
                event["alarm_id"] = event["detail"]["alarm_id"]
                event["alarm_state"] = event["detail"]["alarm_state"].lower()
                event["timestamp"] = int(datetime.datetime.strptime(
                    event["time"], '%Y-%m-%dT%H:%M:%SZ').timestamp())
                event["expires"] = event["timestamp"] + \
                    int(os.environ["ITEM_TTL"])
                event["detail"]["time"] = event["time"]
                DYNAMO_TABLE.put_item(Item=event)
                if "Multiplex" in event["detail-type"]:
                    print("Multiplex alert stored")
                else:
                    print("MediaLive alert stored")
            if "BatchUpdateSchedule" in item["type"]:
                print("Creating an ARN for BatchUpdateSchedule event.")
                item["resource_arn"] = "arn:aws:medialive:" + event['region'] + ":" + \
                    event['account'] + ":channel:" + \
                    event['detail']['requestParameters']['channelId']
        elif event["source"] == "aws.mediapackage":
            if "HarvestJob" in item["type"]:
                print("Asking MediaPackage for the ARN of endpoint in a HarvestJob event.")
                # to get the ARN, ask mediapackage to describe the origin endpoint
                # the ARN available through resources is the HarvestJob ARN, not the endpoint
                orig_id_expr = parse('$..origin_endpoint_id')
                orig_id = [match.value for match in orig_id_expr.find(event)]
                if orig_id:
                    emp_client = boto3.client('mediapackage')
                    response = emp_client.describe_origin_endpoint(
                        Id=orig_id[0])
                    item["resource_arn"] = response["Arn"]
                else:
                    print("Skipping this event. Origin ID not present in the HarvestJob event." + item["type"])
            else:
                # for certain events, the ARN is not labeled as an ARN but instead put in the resources list
                if not arns and event["resources"]:
                    if "vod" not in event["resources"][0]:
                        item["resource_arn"] = event["resources"][0]
        elif event["source"] == "aws.mediaconnect":
            # handle medialive pipeline alerts
            if "MediaConnect" in event["detail-type"] and "Alert" in event["detail-type"]:
                event["resource_arn"] = event["detail"]["flow_arn"]
                event["alarm_id"] = event["detail"]["alarm_id"]
                event["alarm_state"] = event["detail"]["alarm_state"].lower()
                event["timestamp"] = int(datetime.datetime.strptime(
                    event["time"], '%Y-%m-%dT%H:%M:%SZ').timestamp())
                event["expires"] = event["timestamp"] + \
                    int(os.environ["ITEM_TTL"])
                event["detail"]["time"] = event["time"]
                DYNAMO_TABLE.put_item(Item=event)
                print("MediaConnect alert stored")
        # if item has no resource arn, don't save in DB
        if "resource_arn" in item:
            print("Storing media service event.")
            print(item)
            CLOUDWATCH_EVENTS_TABLE_NAME.put_item(Item=item)
        else:
            print("Skipping this event. " + item["type"])

    except ClientError as error:
        print(error)
    return True
