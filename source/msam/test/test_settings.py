"""
This module is provides unit tests for the settings.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

KEY = 'key'
VALUE = 'value'
CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "ClientError")

@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestSettings(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_put_setting(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the put_setting function
        """
        from chalicelib import settings
        settings.put_setting(KEY, VALUE)

    def test_get_setting(self, patched_env, patched_resource, patched_client):
        """
        Test the get_setting function
        """
        from chalicelib import settings
        settings.get_setting(KEY)

        mock_table = MagicMock()
        mock_table.get_item.return_value = {"Item": {"value": VALUE}}
        patched_resource.return_value.Table.return_value = mock_table
        settings.get_setting(KEY)

        mock_table.get_item.side_effect = CLIENT_ERROR
        patched_resource.return_value.Table.return_value = mock_table
        settings.get_setting(KEY)


    def test_application_settings(self, patched_env, patched_resource, patched_client):
        """
        Test the application_settings function
        """
        from chalicelib import settings
        mocked_req = MagicMock()
        mocked_req.method = "PUT"
        settings.application_settings(mocked_req, KEY)
        mocked_req.method = "DELETE"
        settings.application_settings(mocked_req, KEY)
        mocked_req.method = "GET"
        settings.application_settings(mocked_req, KEY)
        
        with patch.object(settings, 'get_setting', side_effect=CLIENT_ERROR):
             settings.application_settings(mocked_req, KEY)