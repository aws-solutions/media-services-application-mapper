"""
This module is the custom resource used by the MSAM's CloudFormation
templates to populate the web bucket with contents of the MSAM web archive.
"""

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import json
import os
from subprocess import call
import boto3
from botocore.exceptions import ClientError
import resource_tools

WEB_FOLDER = "/tmp/msam"


def lambda_handler(event, context):
    """
    Lambda entry point. Print the event first.
    """
    print("Event Input: %s" % json.dumps(event))
    bucket_name = event["ResourceProperties"]["BucketName"]
    result = {'Status': 'SUCCESS', "StackId": event["StackId"], "RequestId": event["RequestId"], "LogicalResourceId": event["LogicalResourceId"], 'Data': {}, 'ResourceId': bucket_name}

    if event.get("PhysicalResourceId", False):
        result["PhysicalResourceId"] = event["PhysicalResourceId"]
    else:
        result["PhysicalResourceId"] = "{}-{}".format(resource_tools.stack_name(event), event["LogicalResourceId"])

    try:
        if event["RequestType"] == "Create" or event["RequestType"] == "Update":
            print(event["RequestType"])
            replace_bucket_contents(bucket_name)
        elif event["RequestType"] == "Delete":
            print(event["RequestType"])
            delete_bucket_contents(bucket_name)
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


def replace_bucket_contents(bucket_name):
    """
    This function is responsible for removing any existing contents
    in the specified bucket, and adding contents from the zip archive.
    """
    client = boto3.client("s3")
    region = os.environ["AWS_REGION"]
    stamp = os.environ["BUILD_STAMP"]
    code_bucket = os.environ["BUCKET_BASENAME"]
    source = "https://{code_bucket}-{region}.s3.amazonaws.com/msam/msam-web-{stamp}.zip".format(code_bucket=code_bucket, region=region, stamp=stamp)
    
    # empty the bucket
    delete_bucket_contents(bucket_name)

    # execute these commands to download the zip and extract it locally
    command_list = [
        "rm -f /tmp/msam-web-{stamp}.zip".format(stamp=stamp), "rm -rf {folder}".format(folder=WEB_FOLDER),
        "mkdir {folder}".format(folder=WEB_FOLDER), "unzip msam-web-{stamp}.zip -d {folder}".format(stamp=stamp, folder=WEB_FOLDER), "ls -l {folder}".format(folder=WEB_FOLDER)
    ]
    for command in command_list:
        print(call(command, shell=True))

    # upload each local file to the bucket, preserve folders
    for dirpath, _, filenames in os.walk(WEB_FOLDER):
        for name in filenames:
            local = "{}/{}".format(dirpath, name)
            remote = local.replace("{}/".format(WEB_FOLDER), "")
            content_type = None
            if remote.endswith(".js"):
                content_type = "application/javascript"
            elif remote.endswith(".html"):
                content_type = "text/html"
            elif remote.endswith(".css"):
                content_type = "text/css"
            else:
                content_type = "binary/octet-stream"
            client.put_object(Bucket=bucket_name, Key=remote, Body=open(local, 'rb'), ContentType=content_type)


def delete_bucket_contents(bucket_name):
    """
    This function is responsible for removing all contents from the specified bucket.
    """
    client = boto3.client("s3")
    response = client.list_objects_v2(Bucket=bucket_name)
    if "Contents" in response:
        for item in response["Contents"]:
            client.delete_object(Bucket=bucket_name, Key=item["Key"])
