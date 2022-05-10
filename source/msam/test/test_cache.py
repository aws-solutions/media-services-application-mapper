"""
This module is provides unit tests for the cache.py module.
"""

# pylint: disable=C0415

import unittest
from unittest.mock import MagicMock, patch
from unittest.mock import Mock
from botocore.exceptions import ClientError

SERVICE = 'medialive-channel'
REGION = 'us-west-2'
ARN = 'THIS-IS-NOT-AN-ARN'


class TestCache(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_cached_by_service_success(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the cached_by_service function
        """
        from chalicelib import cache
        cache.cached_by_service(SERVICE)

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_cached_by_service_region(self, patched_env, patched_resource,
                                      patched_client):
        """
        Test the cached_by_service_region function
        """
        from chalicelib import cache
        cache.cached_by_service_region(SERVICE, REGION)

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_cached_by_arn(self, patched_env, patched_resource,
                           patched_client):
        """
        Test the cached_by_arn function
        """
        from chalicelib import cache
        cache.cached_by_arn(ARN)

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_regions(self, patched_env, patched_resource, patched_client):
        """
        Test the regions function
        """
        from chalicelib import cache
        cache.regions()
