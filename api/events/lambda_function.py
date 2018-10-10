# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import boto3
import datetime
import json
import os
import time

DYNAMO_RESOURCE = boto3.resource('dynamodb',
                                 region_name=os.environ["EVENTS_TABLE_REGION"])
DYNAMO_TABLE = DYNAMO_RESOURCE.Table(os.environ["EVENTS_TABLE_NAME"])


def lambda_handler(event, context):
    try:
        if "MediaLive" in event["detail-type"] and "Alert" in event["detail-type"]:
            # handle medialive pipeline alerts
            print(event)
            event["resource_arn"] = event["detail"]["channel_arn"]
            event["alarm_id"] = event["detail"]["alarm_id"]
            event["alarm_state"] = event["detail"]["alarm_state"].lower()
            event["timestamp"] = int(datetime.datetime.strptime(
                event["time"], '%Y-%m-%dT%H:%M:%SZ').timestamp())
            event["expires"] = event["timestamp"] + int(os.environ["ITEM_TTL"])
            event["detail"]["time"] = event["time"]
            DYNAMO_TABLE.put_item(Item=event)
            print("stored")
        else:
            # print non-handled events
            print(event["detail-type"])
            print("not stored")
    except Exception as e:
        print(e)
    return True
