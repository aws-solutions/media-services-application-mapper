"""
This module is the custom resource used by the MSAM's CloudFormation
templates to populate the web bucket with contents of the MSAM web archive.
"""

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import logging
import os
import zipfile

from crhelper import CfnResource
import boto3

WEB_FOLDER = "/tmp/msam"

logger = logging.getLogger(__name__)
helper = CfnResource()


@helper.create
@helper.update
def update_web_content(event, _):
    """
    This function is responsible for creating or updating web content
    """
    bucket_name = event["ResourceProperties"]["BucketName"]
    delete_bucket_contents(bucket_name)
    put_bucket_contents(bucket_name)


@helper.delete
def delete_web_content(event, _):
    """
    This function is responsible for deleting web content
    """
    bucket_name = event["ResourceProperties"]["BucketName"]
    delete_bucket_contents(bucket_name)


def handler(event, context):
    """
    Lambda entry point.
    """
    helper(event, context)


def put_bucket_contents(bucket_name):
    """
    This function is responsible for removing any existing contents
    in the specified bucket, and adding contents from the zip archive.
    """
    client = boto3.client("s3")
    stamp = os.environ["BUILD_STAMP"]
    webzip = "msam-web-{stamp}.zip".format(stamp=stamp)

    # unzip the content if this is a cold start
    if not os.path.isdir(WEB_FOLDER):
        logger.info("unzipping web content locally")
        os.mkdir(WEB_FOLDER)
        with zipfile.ZipFile(webzip, "r") as zip_ref:
            zip_ref.extractall(WEB_FOLDER)

    # upload each local file to the bucket, preserve folders
    for dirpath, _, filenames in os.walk(WEB_FOLDER):
        for name in filenames:
            local = "{}/{}".format(dirpath, name)
            remote = local.replace("{}/".format(WEB_FOLDER), "")
            logger.info('put %s', local)
            content_type = None
            if remote.endswith(".js"):
                content_type = "application/javascript"
            elif remote.endswith(".html"):
                content_type = "text/html"
            elif remote.endswith(".css"):
                content_type = "text/css"
            else:
                content_type = "binary/octet-stream"
            client.put_object(Bucket=bucket_name,
                              Key=remote,
                              Body=open(local, 'rb'),
                              ContentType=content_type)


def delete_bucket_contents(bucket_name):
    """
    This function is responsible for removing all contents from the specified bucket.
    """
    client = boto3.client("s3")
    response = client.list_objects_v2(Bucket=bucket_name)
    for item in response.get("Contents", []):
        logger.info('delete %s', item["Key"])
        client.delete_object(Bucket=bucket_name, Key=item["Key"])
    while response.get("NextContinuationToken", False):
        response = client.list_objects_v2(
            Bucket=bucket_name,
            ContinuationToken=response.get("NextContinuationToken"))
        for item in response.get("Contents", []):
            logger.info('delete %s', item["Key"])
            client.delete_object(Bucket=bucket_name, Key=item["Key"])
