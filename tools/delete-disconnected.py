# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
"""
This is a tool to clean nodes without connections from the content database table.
"""

import os
import sys

import boto3

CONNECTION_TYPES = ["cloudfront-distribution-medialive-input", "medialive-channel-mediapackage-channel", "medialive-channel-mediastore-container", "medialive-input-medialive-channel", "mediapackage-channel-mediapackage-origin-endpoint","mediapackage-origin-endpoint-cloudfront-distribution","mediastore-container-medialive-input", "s3-bucket-cloudfront-distribution", "s3-bucket-medialive-input","mediapackage-origin-endpoint-speke-keyserver","user-defined-connection"]
NODE_TYPES = ["s3", "cloudfront-distribution"]

#
# CONTENT_TABLE_NAME="IBC2018-DynamoDB-Content-17I5MRXA2FBF7" CACHE_ITEM_TTL=7200 python delete-disconnected.py
#

if __name__ == "__main__":
    sys.path.insert(0, '../api/msam')
    from chalicelib.cache import cached_by_service
    node_type = "S3"
    nodes = []
    connections = []
    for node_type in NODE_TYPES:
        nodes = nodes + cached_by_service(node_type)
    for conn_type in CONNECTION_TYPES:
        connections = connections + cached_by_service(conn_type)
    remove_nodes = []
    # scan for connections with 'to' or 'from' set with
    for node in nodes:
        found = False
        for conn in connections:
            if node["arn"] == conn["from"] or node["arn"] == conn["to"]:
                found = True
        if not found:
            remove_nodes.append(node)

    resource = boto3.resource("dynamodb")
    table = resource.Table(os.environ["CONTENT_TABLE_NAME"])
    for node in remove_nodes:
        print(node)
        table.delete_item(Key={"arn": node["arn"]})
