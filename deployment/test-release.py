# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

"""
This module sends notification about the end of a workflow run
and its associated artifacts.
"""

import os
import requests
from aws_requests_auth.boto_utils import BotoAWSRequestsAuth
from urllib.parse import urlparse

API_REGION = os.environ.get('AWS_DEFAULT_REGION')
TEST_ENDPOINT = os.environ.get('TEST_ENDPOINT')

def main():
    parsed = urlparse(TEST_ENDPOINT)
    auth = BotoAWSRequestsAuth(aws_host=parsed.netloc,
                               aws_region=API_REGION,
                               aws_service='execute-api')
    response = requests.post(TEST_ENDPOINT,  auth=auth, timeout=25)
    print(response.json())
    if response.status_code != 200:
        return 1
    else:
        return 0

if __name__ == "__main__":
    main()
