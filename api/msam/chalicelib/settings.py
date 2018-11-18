# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
"""
This file contains helper functions related to settings.
"""

import os
from urllib.parse import unquote

import boto3
from botocore.exceptions import ClientError

SETTINGS_TABLE_NAME = os.environ["SETTINGS_TABLE_NAME"]

DYNAMO_RESOURCE = boto3.resource("dynamodb")


def put_setting(key, value):
    """
    Put a string value into the setting table under key.
    """
    table = DYNAMO_RESOURCE.Table(SETTINGS_TABLE_NAME)
    # write to the database
    table.put_item(Item={"id": key, "value": value})


def get_setting(key):
    """
    Retrieve a setting object from the database.
    """
    table = DYNAMO_RESOURCE.Table(SETTINGS_TABLE_NAME)
    # get the settings object
    setting = None
    try:
        response = table.get_item(Key={'id': key})
        # return the response or an empty object
        if "Item" in response:
            setting = response["Item"]["value"]
        else:
            setting = None
    except ClientError as error:
        print(error)
    return setting


def application_settings(request, item_key):
    """
    API entry point to get or set the object value for a setting.
    """
    try:
        item_key = unquote(item_key)
        print(item_key)
        settings = {}
        print(request.method)
        if request.method == 'PUT' or request.method == 'POST':
            print(request.json_body)
            settings = request.json_body
            put_setting(item_key, settings)
            settings = {"message": "saved"}
            print(settings)
        elif request.method == 'GET':
            settings = get_setting(item_key)
        elif request.method == 'DELETE':
            table = DYNAMO_RESOURCE.Table(SETTINGS_TABLE_NAME)
            table.delete_item(Key={"id": item_key})
    except ClientError as error:
        # send the exception back in the object
        print(error)
        settings = {"exception": str(error)}
    return settings
