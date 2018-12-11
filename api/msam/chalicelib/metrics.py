# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
"""
This file contains helper functions to send anonymous template launch metrics to AWS Solutions Builders.
"""

import datetime
import json
import os
import uuid
import urllib.request
from urllib.error import URLError, HTTPError

from chalicelib.resource_tools import send as send_response, stack_name

SOLUTION_ID = "SO0048"


def handler(event, context):
    """
    This function is responsible for handling the Lambda invocation for the custom resource.
    """
    print("Event Input: %s" % json.dumps(event))
    # set up the default result
    result = {'Status': 'SUCCESS', "StackId": event["StackId"], "RequestId": event["RequestId"], "LogicalResourceId": event["LogicalResourceId"], 'Data': {}}
    # determine the physical resource ID
    if event.get("PhysicalResourceId", False):
        result["PhysicalResourceId"] = event["PhysicalResourceId"]
    else:
        result["PhysicalResourceId"] = "{}-{}".format(stack_name(event), event["LogicalResourceId"])
    # set the resource ID = physical resource ID
    result['ResourceId'] = result["PhysicalResourceId"]
    try:
        stack_id_split = event["StackId"].split(':')
        region = stack_id_split[3]
        account_id = stack_id_split[4]
        request_type = event["RequestType"]
        # send the metric
        send_metrics({'SolutionId': SOLUTION_ID, 'UUID': str(uuid.uuid4()), "BuildStamp": os.environ["BUILD_STAMP"], "Region": region, "RequestType": request_type, "AccountID": account_id})
    except (IndexError, KeyError, URLError, HTTPError) as error:
        # fail silently on error sending metric
        print("EXCEPTION {}".format(error))
    # send the cloudformation response
    send_response(event, context, result['Status'], result['Data'], result["PhysicalResourceId"])


def send_metrics(config):
    """
    This function is responsible for formatting the metrics data and sending it to the endpoint.
    """
    metrics = {}
    metrics['Solution'] = config['SolutionId']
    metrics['UUID'] = config['UUID']
    metrics['TimeStamp'] = str(datetime.datetime.utcnow().isoformat())
    metrics['Data'] = config
    url = 'https://metrics.awssolutionsbuilder.com/generic'
    data = json.dumps(metrics).encode('utf8')
    headers = {'content-type': 'application/json'}
    req = urllib.request.Request(url, data, headers)
    response = urllib.request.urlopen(req)
    print('RESPONSE-CODE {}'.format(response.getcode()))
    print('METRICS-SENT {}'.format(data))
