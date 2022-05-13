"""
This module is provides unit tests for the channels.py module.
"""

# pylint: disable=C0415

import unittest
from unittest.mock import patch

SERVICE = 'medialive-channel'
REGION = 'us-west-2'
ARN = 'THIS-IS-NOT-AN-ARN'
CHANNEL_NAME = "NO-CHANNEL"
NODE_IDS = ["A", "B", "C", "Z"]


@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestChannels(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """
    def test_delete_channel_nodes(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the delete_channel_nodes function
        """                    
        from chalicelib import channels
        channels.delete_channel_nodes(CHANNEL_NAME)

    def test_get_channel_list(self, patched_env, patched_resource,
                              patched_client):
        """
        Test the get_channel_list function
        """                    
        from chalicelib import channels
        channels.get_channel_list()

    def test_set_channel_nodes(self, patched_env, patched_resource,
                               patched_client):
        """
        Test the set_channel_nodes function
        """                    
        from chalicelib import channels
        channels.set_channel_nodes(CHANNEL_NAME, NODE_IDS)

    def test_get_channel_nodes(self, patched_env, patched_resource,
                               patched_client):
        """
        Test the get_channel_nodes function
        """                    
        from chalicelib import channels
        channels.get_channel_nodes(CHANNEL_NAME)

    def test_delete_all_channels(self, patched_env, patched_resource,
                                 patched_client):
        """
        Test the delete_all_channels function
        """                    
        from chalicelib import channels
        channels.delete_all_channels()
