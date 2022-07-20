"""
This module is provides unit tests for the db/lambda_function.py module.
"""

# pylint: disable=C0415

import unittest
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError

CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "MockedFunction")

@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestDb(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_create_update(self, patched_client, patched_resource, patched_env):
        """
        Test the create_udpate function
        """
        from db import lambda_function
        mocked_event = {"ResourceProperties": {"SettingsTable": "settings_table"}}
        lambda_function.create_update(mocked_event, MagicMock())
    
    def test_lambda_handler(self, patched_client, patched_resource, patched_env):
        """
        Test the lambda_handler function
        """
        from db import lambda_function
        mocked_event = {"ResourceProperties": {"SettingsTable": "settings_table"}}
        with patch.object(lambda_function, 'helper'):
            lambda_function.lambda_handler(mocked_event, MagicMock())
    
    def test_make_default_settings(self, patched_client, patched_resource, patched_env):
        """
        Test the make_default_settings function
        """
        from db import lambda_function
        lambda_function.make_default_settings("settings_table")

        patched_resource.return_value.Table.return_value.put_item.side_effect = CLIENT_ERROR
        lambda_function.make_default_settings("settings_table")