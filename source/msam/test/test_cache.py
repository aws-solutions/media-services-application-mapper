"""
This module is provides unit tests for the cache.py module.
"""

# pylint: disable=C0415

import unittest
from unittest.mock import MagicMock, patch
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
        cache.boto3.resource.assert_called_once()
        cache.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        cache.boto3.resource.return_value.Table.return_value.query.assert_called_once()

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
        cache.boto3.resource.assert_called_once()
        cache.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        cache.boto3.resource.return_value.Table.return_value.query.assert_called_once()

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
        cache.boto3.resource.assert_called_once()
        cache.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        cache.boto3.resource.return_value.Table.return_value.query.assert_called_once()

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
        cache.boto3.client.assert_called_once()
        cache.boto3.client.return_value.describe_regions.assert_called_once()

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_put_cached_data(self, patched_env, patched_resource, patched_client):
        """
        Test the put_cached_data function
        """
        from chalicelib import cache
        request_obj = MagicMock()
        request_obj.json_body = [{"expires": 1657658393, "updated": 1657658399}]
        cache.put_cached_data(request_obj)
        cache.boto3.resource.assert_called_once()
        cache.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        
    @patch('os.environ')
    @patch('boto3.session.Session.resource', new=boto_resource_error)
    @patch('boto3.client')
    def test_put_cached_data_fail(self, patched_env, patched_client):
        """
        Test the put_cached_data function
        """
        from chalicelib import cache
        cache.put_cached_data(SERVICE)
        self.assertTrue(internal_exception_raised())


    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_delete_cached_data(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_cached_data function
        """
        from chalicelib import cache
        cache.delete_cached_data(ARN)
        cache.boto3.resource.assert_called_once()
        cache.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        cache.boto3.resource.return_value.Table.return_value.delete_item.assert_called_once()

    @patch('os.environ')
    @patch('boto3.session.Session.resource', new=boto_resource_error)
    @patch('boto3.client')
    def test_delete_cached_data_fail(self, patched_env, patched_client):
        """
        Test the delete_cached_data function
        """
        from chalicelib import cache
        cache.delete_cached_data(ARN)
        self.assertTrue(internal_exception_raised())
