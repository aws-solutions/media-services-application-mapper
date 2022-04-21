# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
"""
This file contains helper functions related to resource notes.
"""

import os
import time
from urllib.parse import unquote

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from botocore.config import Config

# table names generated by CloudFormation
NOTES_TABLE_NAME = os.environ["NOTES_TABLE_NAME"]
FUNCTION_NAME = os.environ["DELETE_NOTES_FUNCTION"]
SOLUTION_ID = os.environ['SOLUTION_ID']
USER_AGENT_EXTRA = {"user_agent_extra": SOLUTION_ID}
MSAM_BOTO3_CONFIG = Config(**USER_AGENT_EXTRA)

DYNAMO_RESOURCE = boto3.resource("dynamodb", config=MSAM_BOTO3_CONFIG)
NOTES_TABLE = DYNAMO_RESOURCE.Table(NOTES_TABLE_NAME)
LAMBDA_CLIENT = boto3.client("lambda", config=MSAM_BOTO3_CONFIG)

def get_resource_notes(resource_arn):
    """
    API entry point to return notes associated with a resource.
    """
    arn = unquote(resource_arn)
    try:
        response = NOTES_TABLE.query(
            KeyConditionExpression=Key('resource_arn').eq(arn))
        print(response)
        # return the response or an empty object
        notes = response["Items"]
        print("retrieved")
    except ClientError as error:
        print(error)
        notes = []
    return notes

def get_all_notes():
    """
    API entry point to return all notes in the database.
    """
    try:
        response = NOTES_TABLE.scan()
        print(response)
        notes = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = NOTES_TABLE.scan(
                ExclusiveStartKey=response["LastEvaluatedKey"])
            notes = notes + response.get("Items", [])
        print("retrieved")
    except ClientError as error:
        print(error)
        notes = []
    # order notes in descending order by timestamp before returning
    return notes


def update_resource_notes(resource_arn, notes):
    """
    API entry point to update notes of a given resource.
    """
    result = {"message": "notes saved"}
    timestamp = int(time.time())
    arn = unquote(resource_arn)
    index = arn.count("arn:")
    type = ["Tile", "Node", "Edge"]
    try:
        string_notes = notes.json_body
        item = {
                "timestamp": timestamp,
                "resource_arn": arn,
                "notes": string_notes,
                "type": type[index]
            }
        NOTES_TABLE.put_item(Item=item)
    except ClientError as error:
        print(error)
        result = {"exception": str(error)}
    return result

def delete_resource_notes(resource_arn):
    """
    API entry point to delete notes of a given resource.
    """
    result = {"message": "notes deleted"}
    arn = unquote(resource_arn)
    try:
        NOTES_TABLE.delete_item(Key={"resource_arn": arn})
    except ClientError as error:
        print(error)
        result = {"exception": str(error)}
    return result

# delete all
def delete_all_notes_proxy():
    """
    API entry point to delete all notes.
    """
    result = {}
    try:
        result = LAMBDA_CLIENT.invoke(
            FunctionName=FUNCTION_NAME,
            InvocationType='Event'
        )
    except ClientError as error:
        print(error)
        result = {"exception": str(error)}

    return result

def delete_all_notes():
    """
    API entry point to delete all notes.
    """
    result = {"message": "all notes deleted"}
    # scan and delete notes table contents
    try:
        response = NOTES_TABLE.scan(ProjectionExpression="resource_arn")
        items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = NOTES_TABLE.scan(
                ProjectionExpression="resource_arn",
                ExclusiveStartKey=response["LastEvaluatedKey"])
            items = items + response.get("Items", [])
        for item in items:
            NOTES_TABLE.delete_item(Key={"resource_arn": item["resource_arn"]})
    except ClientError as error:
        print(error)
        result = {"exception": str(error)}
    return result
