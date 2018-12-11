"""
This module is responsible for sending the CloudFormation
completion response from a custom resource.
"""

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import json
from botocore.exceptions import ClientError
from botocore.vendored import requests


def send(event, context, response_status, response_data, physical_resource_id):
    """
    This function is responsible for sending the custom resource response.
    """
    response_url = event['ResponseURL']

    response_body = {
        'Status': response_status,
        'Reason': 'See the details in CloudWatch Log Stream: ' + context.log_stream_name,
        'PhysicalResourceId': physical_resource_id or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': response_data
    }

    json_response_body = json.dumps(response_body)

    print("Response body:\n" + json_response_body)

    headers = {'content-type': '', 'content-length': str(len(json_response_body))}

    try:
        response = requests.put(response_url, data=json_response_body, headers=headers)
        print("Status code: " + response.reason)
    except ClientError as client_error:
        print("send(..) failed executing requests.put(..): " + str(client_error))


def stack_name(event):
    """
    Return the stack name from the provided resource properties.
    """
    try:
        response = event['ResourceProperties']['StackName']
    except ClientError:
        response = None
    return response
