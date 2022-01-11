"""
This module is the custom resource used by the MSAM's CloudFormation
templates to populate the database with reasonable defaults.
"""

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os
import json
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from crhelper import CfnResource

helper = CfnResource()
SOLUTION_ID = os.environ['SOLUTION_ID']
USER_AGENT_EXTRA = {"user_agent_extra": SOLUTION_ID}
MSAM_BOTO3_CONFIG = Config(**USER_AGENT_EXTRA)


@helper.create
@helper.update
def create_update(event, _):
    """
    Lambda entry point. Print the event first.
    """
    print(f"Event Input: {json.dumps(event)}")
    settings_table = event["ResourceProperties"]["SettingsTable"]
    make_default_settings(settings_table)


def lambda_handler(event, context):
    """
    This function is the entry point for the Lambda-backed custom resource.
    """
    helper(event, context)


def make_default_settings(settings_table):
    """
    This function is responsible for adding/replacing default settings in the specified DynamoDB table.
    """
    ec2_client = boto3.client("ec2", config=MSAM_BOTO3_CONFIG)
    response = ec2_client.describe_regions()
    all_regions = list(r['RegionName'] for r in response['Regions'])
    dynamodb_resource = boto3.resource("dynamodb", config=MSAM_BOTO3_CONFIG)
    # determine the current region
    session = boto3.session.Session()
    current_region = session.region_name
    print(f"current region is {current_region}")
    inventory_regions = [current_region, "global"]
    print(f"default inventory-regions are {json.dumps(inventory_regions)}")

    # update the DynamoDB settings table
    table = dynamodb_resource.Table(settings_table)

    # upgrade never-cache-regions setting if needed
    try:
        response = table.get_item(Key={"id": "never-cache-regions"})
        if "Item" in response:
            never_cache_regions = response["Item"]["value"]
            inventory_regions = list(
                set(never_cache_regions).symmetric_difference(
                    set(all_regions))) + ['global']
            print(
                f"updated inventory-regions are {json.dumps(inventory_regions)}"
            )
        else:
            print("problem reading never-cache-regions setting")
    except ClientError:
        print("never-cache-regions setting does not exist")

    # default app-alarm-update-interval
    try:
        table.put_item(Item={
            "id": "app-alarm-update-interval",
            "value": 10
        },
                       ConditionExpression="attribute_not_exists(id)")
        print("added default app-alarm-update-interval setting")
    except ClientError:
        print("app-alarm-update-interval setting exists")
    # default app-event-update-interval
    try:
        table.put_item(Item={
            "id": "app-event-update-interval",
            "value": 10
        },
                       ConditionExpression="attribute_not_exists(id)")
        print("added default app-event-update-interval setting")
    except ClientError:
        print("app-event-update-interval setting exists")
    # default app-tile-update-interval
    try:
        table.put_item(Item={
            "id": "app-tile-update-interval",
            "value": 300
        },
                       ConditionExpression="attribute_not_exists(id)")
        print("added default app-tile-update-interval setting")
    except ClientError:
        print("app-tile-update-interval setting exists")
    # default displayed regions
    try:
        table.put_item(Item={
            "id": "regions",
            "value": [current_region]
        },
                       ConditionExpression="attribute_not_exists(id)")
        print("added default regions setting")
    except ClientError:
        print("regions setting exists")
    # inventory-regions
    try:
        table.put_item(Item={
            "id": "inventory-regions",
            "value": inventory_regions
        },
                       ConditionExpression="attribute_not_exists(id)")
        print("added default inventory-regions setting")
    except ClientError:
        print("inventory-regions setting exists")
    # layout-method
    try:
        table.put_item(Item={
            "id": "layout-method",
            "value": {
                "method": "directed"
            }
        },
                       ConditionExpression="attribute_not_exists(id)")
        print("added default layout-method setting")
    except ClientError:
        print("layout-method setting exists")
    # default tile-view
    try:
        table.put_item(Item={
            "id": "tile-view",
            "value": {
                "show_normal_tiles": True,
                "show_alarm_tiles": True,
                "tile_filter_text": "Showing All Tiles"
            }
        },
                       ConditionExpression="attribute_not_exists(id)")
        print("added default tile-view setting")
    except ClientError:
        print("tile-view setting exists")
