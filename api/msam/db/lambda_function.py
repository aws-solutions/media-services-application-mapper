"""
This module is the custom resource used by the MSAM's CloudFormation
templates to populate the database with reasonable defaults.
"""

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import json
import boto3
from botocore.exceptions import ClientError
import resource_tools


def lambda_handler(event, context):
    """
    Lambda entry point. Print the event first.
    """
    print("Event Input: %s" % json.dumps(event))
    settings_table = event["ResourceProperties"]["SettingsTable"]
    result = {'Status': 'SUCCESS', "StackId": event["StackId"], "RequestId": event["RequestId"], "LogicalResourceId": event["LogicalResourceId"], 'Data': {}, 'ResourceId': settings_table}

    if event.get("PhysicalResourceId", False):
        result["PhysicalResourceId"] = event["PhysicalResourceId"]
    else:
        result["PhysicalResourceId"] = "{}-{}".format(resource_tools.stack_name(event), event["LogicalResourceId"])

    try:
        if event["RequestType"] == "Create" or event["RequestType"] == "Update":
            print(event["RequestType"])
            make_default_settings(settings_table)
    except ClientError as client_error:
        print("Exception: %s" % client_error)
        result = {
            'Status': 'FAILED',
            "StackId": event["StackId"],
            "RequestId": event["RequestId"],
            "LogicalResourceId": event["LogicalResourceId"],
            'Data': {
                "Exception": str(client_error)
            },
            'ResourceId': None
        }
    resource_tools.send(event, context, result['Status'], result['Data'], result["PhysicalResourceId"])


def make_default_settings(settings_table):
    """
    This function is responsible for adding/replacing default settings in the specified DynamoDB table.
    """
    ec2_client = boto3.client("ec2")
    dynamodb_resource = boto3.resource("dynamodb")
    # determine the current region
    session = boto3.session.Session()
    current_region = session.region_name
    print("current region is {}".format(current_region))
    # get all regions
    all_regions = ec2_client.describe_regions()
    # create a list of all regions except the current
    never_cache_regions = []
    for region in all_regions['Regions']:
        region_name = region['RegionName']
        if region_name != current_region:
            never_cache_regions.append(region_name)
    print("never-cache-regions are {}".format(json.dumps(never_cache_regions)))
    # update the DynamoDB table
    table = dynamodb_resource.Table(settings_table)
    # default app-alarm-update-interval
    try:
        table.put_item(Item={"id": "app-alarm-update-interval", "value": 10}, ConditionExpression="attribute_not_exists(id)")
        print("added default app-alarm-update-interval setting")
    except ClientError:
        print("app-alarm-update-interval setting exists")
    # default app-event-update-interval
    try:
        table.put_item(Item={"id": "app-event-update-interval", "value": 10}, ConditionExpression="attribute_not_exists(id)")
        print("added default app-event-update-interval setting")
    except ClientError:
        print("app-event-update-interval setting exists")
    # default app-tile-update-interval
    try:
        table.put_item(Item={"id": "app-tile-update-interval", "value": 300}, ConditionExpression="attribute_not_exists(id)")
        print("added default app-tile-update-interval setting")
    except ClientError:
        print("app-tile-update-interval setting exists")
    # default displayed regions
    try:
        table.put_item(Item={"id": "regions", "value": [current_region]}, ConditionExpression="attribute_not_exists(id)")
        print("added default regions setting")
    except ClientError:
        print("regions setting exists")
    # never-cache-regions
    try:
        table.put_item(Item={"id": "never-cache-regions", "value": never_cache_regions}, ConditionExpression="attribute_not_exists(id)")
        print("added default never-cache-regions setting")
    except ClientError:
        print("never-cache-regions setting exists")
    # layout-method
    try:
        table.put_item(Item={"id": "layout-method", "value": {"method": "directed"}}, ConditionExpression="attribute_not_exists(id)")
        print("added default layout-method setting")
    except ClientError:
        print("layout-method setting exists")
