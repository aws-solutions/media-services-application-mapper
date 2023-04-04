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

    def setUp(self):
        from chalicelib import settings
        settings.DYNAMO_RESOURCE.reset_mock()
        settings.DYNAMO_RESOURCE.Table.return_value.put_item.reset_mock()

    def test_put_setting(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the put_setting function
        """
        from chalicelib import settings
        settings.put_setting(KEY, VALUE)
        settings.DYNAMO_RESOURCE.Table.return_value.put_item.assert_called_once_with(Item={"id": KEY, "value": VALUE})

    def test_get_setting(self, patched_env, patched_resource, patched_client):
        """
        Test the get_setting function
        """
        from chalicelib import settings
        settings.get_setting(KEY)
        settings.DYNAMO_RESOURCE.Table.return_value.get_item.assert_any_call(Key={'id': KEY})


    def test_application_settings(self, patched_env, patched_resource, patched_client):
        """
        Test the application_settings function
        """
        from chalicelib import settings
        mocked_req = MagicMock()
        mocked_req.method = "PUT"
        put_setting_mock = MagicMock()
        original_put_setting = settings.put_setting
        settings.put_setting = put_setting_mock
        settings.application_settings(mocked_req, KEY)
        settings.put_setting.assert_called_once()
        settings.put_setting = original_put_setting
        mocked_req.method = "DELETE"
        settings.application_settings(mocked_req, KEY)
        settings.DYNAMO_RESOURCE.Table.assert_called_once_with('settings_table')
        settings.DYNAMO_RESOURCE.Table.return_value.delete_item.assert_any_call(Key={'id': KEY})
        mocked_req.method = "GET"
        get_setting_mock = MagicMock()
        original_get_setting = settings.get_setting
        settings.get_setting = get_setting_mock
        settings.application_settings(mocked_req, KEY)
        settings.get_setting.assert_called_once()
        settings.get_setting = original_get_setting
        with patch.object(settings, 'get_setting', side_effect=CLIENT_ERROR):
            result = settings.application_settings(mocked_req, KEY)
            self.assertTrue("exception" in result)
