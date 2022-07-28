"""
This module is provides unit tests for the layout.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

# CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "MockedFunction")

@patch('boto3.resource')
@patch('os.environ')
class TestLayout(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """
    def setUp(self):
        """
        This function is responsible for setting up the overall environment before each test
        """
        self.CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "MockedFunction")

    def test_get_view_layout(self, patched_env, patched_resource):
        """
        Test the get_view_layout function
        """
        from chalicelib import layout
        mock_table = MagicMock()
        mock_table.query.return_value = {"Items": []}
        patched_resource.return_value.Table.return_value = mock_table
        layout.get_view_layout("any_view")

        mock_table.query.side_effect = self.CLIENT_ERROR
        layout.get_view_layout("any_view")
        self.assertRaises(ClientError)

    def test_set_node_layout(self, patched_env, patched_resource):
        """
        Test the set_node_layout function
        """
        from chalicelib import layout
        layout_items = [{
            "view": "live__channels",
            "id":
            "arn:aws:cloudfront::111122223333:distribution/E1QOJNA53M5I9W",
            "x": 875,
            "y": 578
        }]
        mock_table = MagicMock()
        mock_table.put_item.return_value = {}
        patched_resource.return_value.Table.return_value = mock_table
        layout.set_node_layout(layout_items)

        mock_table.put_item.side_effect = self.CLIENT_ERROR
        layout.set_node_layout(layout_items)
        self.assertRaises(ClientError)

    def test_delete_node_layout(self, patched_env, patched_resource):
        """
        Test the delete_node_layout function
        """
        from chalicelib import layout
        mock_table = MagicMock()
        mock_table.delete_item.return_value = {}
        patched_resource.return_value.Table.return_value = mock_table
        layout.delete_node_layout("view_name", "a")

        mock_table.delete_item.side_effect = self.CLIENT_ERROR
        layout.delete_node_layout("view_name", "a")
        self.assertRaises(ClientError)

    def test_has_node(self, patched_env, patched_resource):
        """
        Test the has_node function
        """
        from chalicelib import layout
        mock_table = MagicMock()
        mock_table.get_item.return_value = {}
        patched_resource.return_value.Table.return_value = mock_table
        layout.has_node("view_name", "a")

        mock_table.get_item.side_effect = self.CLIENT_ERROR
        layout.has_node("view_name", "a")
        self.assertRaises(ClientError)

    def test_remove_all_diagrams(self, patched_env, patched_resource):
        """
        Test the remove_all_diagrams function
        """
        from chalicelib import layout
        mock_table = MagicMock()
        mock_table.scan.return_value = {"Items":[{"view":"this_view", "id": "view_id"}]}
        mock_table.delete_item.return_value = {}
        patched_resource.return_value.Table.return_value = mock_table
        layout.remove_all_diagrams()

        mock_table.scan.side_effect = self.CLIENT_ERROR
        layout.remove_all_diagrams()
        self.assertRaises(ClientError)
