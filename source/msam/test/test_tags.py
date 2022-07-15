"""
This module is provides unit tests for the tags.py module.
"""

# pylint: disable=C0415,W0201

import json
from multiprocessing.connection import Client
import unittest
from unittest.mock import MagicMock, patch
from botocore.exceptions import ClientError

class TestTags(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    @patch('os.environ')
    @patch('boto3.resource')
    def test_update_diagrams(self, patched_resource, patched_env):
        """
        Test the update_diagrams function
        """
        from chalicelib import tags
        from chalicelib import settings
        # diagram does not exist
        data = "{\"Tags\": {\"MSAM-Diagram\": \"new-diagram\"}}"
        mock_table = MagicMock()
        mock_table.scan.return_value = {"Items": [{"data": data, "arn": "some-arn"}]}
        patched_resource.return_value.Table.return_value = mock_table
        tags.update_diagrams()

        # diagram exists
        with patch.object(settings, 'get_setting', return_value = [{"name": "new-diagram", "view_id": "NewDiagram"}]):
            tags.update_diagrams()
        with patch.object(settings, 'get_setting', 
                    side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "get_setting")):
            tags.update_diagrams()
            self.assertRaises(ClientError)

    @patch('os.environ')
    @patch('boto3.resource')
    def test_update_tiles(self, patched_resource, patched_env):
        """
        Test the update_tiles function
        """
        from chalicelib import tags
        from chalicelib import channels

        data = "{\"Tags\": {\"MSAM-Tile\": \"new-tile\"}}"
        mock_table = MagicMock()
        mock_table.scan.return_value = {"Items": [{"data": data, "arn": "some-arn"}]}
        patched_resource.return_value.Table.return_value = mock_table
        tags.update_tiles()

        # 
        with patch.object(channels, 'get_channel_nodes', return_value = [{"name": "new-tile", "id": "newtile"}]):
            tags.update_tiles()
        with patch.object(channels, 'get_channel_nodes', 
                    side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "get_channel_nodes")):
            tags.update_tiles()
            self.assertRaises(ClientError)
