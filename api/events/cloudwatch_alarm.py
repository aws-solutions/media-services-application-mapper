# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
"""
This Lambda is responsible for receiving and storing CloudWatch alarm events.
This Lambda must be installed into each region where alarms are subscribed to by MSAM nodes.
"""

import os
import json
import time

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from botocore.config import Config

# user-agent config
STAMP = os.environ["BUILD_STAMP"]
MSAM_BOTO3_CONFIG = Config(user_agent="aws-media-services-applications-mapper/{stamp}/cloudwatch_alarm.py".format(stamp=STAMP))

ALARMS_TABLE_NAME = os.environ["ALARMS_TABLE_NAME"]
TABLE_REGION = os.environ["EVENTS_TABLE_REGION"]
DYNAMO_RESOURCE = boto3.resource('dynamodb', region_name=TABLE_REGION, config=MSAM_BOTO3_CONFIG)
ALARMS_TABLE = DYNAMO_RESOURCE.Table(ALARMS_TABLE_NAME)

def lambda_handler(event, _):
    """
    AWS Lambda entry point for receiving alarm state change events through CloudWatch event rule.
    """
    print(event)
    try:
        updated_timestamp = int(time.time())
        # process the data we got from the alarm state change event
        region = event['region']
        alarm_name = event['detail']['alarmName']
        CLOUDWATCH_RESOURCE = boto3.resource('cloudwatch', region_name=region)
        alarm = CLOUDWATCH_RESOURCE.Alarm(alarm_name)

        region_alarm_name = "{}:{}".format(region, alarm_name)        
        state = alarm.state_value
        namespace = alarm.namespace
        state_updated = int(alarm.state_updated_timestamp.timestamp())

        subscribers = subscribers_to_alarm(region_alarm_name)
        for resource_arn in subscribers:
            # only update alarm if it's already in alarm DB through node subscription
            response = ALARMS_TABLE.update_item(
                UpdateExpression='SET StateValue = :state, Updated = :updated, StateUpdated = :stateupdated',
                ConditionExpression=Attr('RegionAlarmName').eq(region_alarm_name),
                Key={'RegionAlarmName': region_alarm_name, 'ResourceArn': resource_arn},
                ExpressionAttributeValues={':state': state, ':updated': updated_timestamp, ':stateupdated': state_updated}
            )
            print("{} updated via CloudWatch alarm change state event".format(resource_arn))
    except ClientError as error:
        if error.response['Error']['Code']=='ConditionalCheckFailedException':  
            print("No update made. Alarm key {} does not exist in database.".format(region_alarm_name)) 
        print(error)
    return True

def subscribers_to_alarm(region_alarm_name):
    """
    Returns subscribed nodes of a CloudWatch alarm in a region.
    """
    subscribers = set()
    try:
        ddb_index_name = 'RegionAlarmNameIndex'
        response = ALARMS_TABLE.query(IndexName=ddb_index_name, KeyConditionExpression=Key('RegionAlarmName').eq(region_alarm_name))
        for item in response["Items"]:
            subscribers.add(item["ResourceArn"])
        while "LastEvaluatedKey" in response:
            response = ddb_table.query(IndexName=ddb_index_name, KeyConditionExpression=Key('RegionAlarmName').eq(region_alarm_name), ExclusiveStartKey=response['LastEvaluatedKey'])
            for item in response["Items"]:
                subscribers.add(item["ResourceArn"])
    except ClientError as error:
        print(error)
    return sorted(subscribers)