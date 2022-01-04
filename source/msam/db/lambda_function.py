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
    dynamodb_resource = boto3.resource("dynamodb", config=MSAM_BOTO3_CONFIG)
    # determine the current region
    session = boto3.session.Session()
    current_region = session.region_name
    print(f"current region is {current_region}")
    # get all regions
    all_regions = ec2_client.describe_regions()
    # create a list of all regions except the current
    never_cache_regions = []
    for region in all_regions['Regions']:
        region_name = region['RegionName']
        if region_name != current_region:
            never_cache_regions.append(region_name)
    print(f"never-cache-regions are {json.dumps(never_cache_regions)}")
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
    # default tile-view
    try:
        table.put_item(Item={"id": "tile-view", "value": {"show_normal_tiles": True, "show_alarm_tiles": True, "tile_filter_text": "Showing All Tiles"}}, ConditionExpression="attribute_not_exists(id)")
        print("added default tile-view setting")
    except ClientError:
        print("tile-view setting exists")
