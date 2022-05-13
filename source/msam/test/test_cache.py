"""
This module is provides unit tests for the cache.py module.
"""

# pylint: disable=C0415

import unittest
from unittest.mock import patch
from botocore.exceptions import ClientError

SERVICE = 'medialive-channel'
REGION = 'us-west-2'
ARN = 'THIS-IS-NOT-AN-ARN'

TESTCASE_STATE = {"exception_raised": False}


def boto_resource_error(*args, **kwargs):
    """
    This function is a replacement for boto3.session.Session.resource that
    raises an exception on use
    """
    TESTCASE_STATE['exception_raised'] = True
    raise ClientError({}, 'unittest')


def internal_exception_raised():
    """
    This function is responsible for indicating if an
    internal exception was raised within the function under test
    """
    return TESTCASE_STATE['exception_raised']


class TestCache(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def setUp(self):
        TESTCASE_STATE['exception_raised'] = False

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
    @patch('boto3.session.Session.resource', new=boto_resource_error)
    @patch('boto3.client')
    def test_cached_by_service_fail(self, patched_env, patched_client):
        """
        Test the cached_by_service function
        """
        from chalicelib import cache
        cache.cached_by_service(SERVICE)
        self.assertTrue(internal_exception_raised())

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_cached_by_service_region_success(self, patched_env,
                                              patched_resource,
                                              patched_client):
        """
        Test the cached_by_service_region function
        """
        from chalicelib import cache
        cache.cached_by_service_region(SERVICE, REGION)

    @patch('os.environ')
    @patch('boto3.session.Session.resource', new=boto_resource_error)
    @patch('boto3.client')
    def test_cached_by_service_region_fail(self, patched_env, patched_client):
        """
        Test the cached_by_service_region function
        """
        from chalicelib import cache
        cache.cached_by_service_region(SERVICE, REGION)
        self.assertTrue(internal_exception_raised())

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_cached_by_arn_success(self, patched_env, patched_resource,
                                   patched_client):
        """
        Test the cached_by_arn function
        """
        from chalicelib import cache
        cache.cached_by_arn(ARN)

    @patch('os.environ')
    @patch('boto3.session.Session.resource', new=boto_resource_error)
    @patch('boto3.client')
    def test_cached_by_arn_fail(self, patched_env, patched_client):
        """
        Test the cached_by_arn function
        """
        from chalicelib import cache
        cache.cached_by_arn(ARN)
        self.assertTrue(internal_exception_raised())

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_regions(self, patched_env, patched_resource, patched_client):
        """
        Test the regions function
        """
        from chalicelib import cache
        cache.regions()
