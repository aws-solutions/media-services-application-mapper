"""
This module is provides unit tests for the settings.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch, MagicMock

KEY = 'key'
VALUE = 'value'

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

    def test_application_settings(self, patched_env, patched_resource, patched_client):
        """
        Test the application_settings function
        """
        from chalicelib import settings
        mocked_req = MagicMock()
        settings.application_settings(mocked_req, KEY)
