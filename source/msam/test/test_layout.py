"""
This module is provides unit tests for the layout.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch


@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestLayout(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_get_view_layout(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the get_view_layout function
        """
        from chalicelib import layout
        layout.get_view_layout("any_view")

    def test_set_node_layout(self, patched_env, patched_resource,
                             patched_client):
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
        layout.set_node_layout(layout_items)

    def test_delete_node_layout(self, patched_env, patched_resource,
                                patched_client):
        """
        Test the delete_node_layout function
        """
        from chalicelib import layout
        layout.delete_node_layout("view_name", "a")

    def test_has_node(self, patched_env, patched_resource, patched_client):
        """
        Test the has_node function
        """
        from chalicelib import layout
        layout.has_node("view_name", "a")

    def test_remove_all_diagrams(self, patched_env, patched_resource,
                                 patched_client):
        """
        Test the remove_all_diagrams function
        """
        from chalicelib import layout
        layout.remove_all_diagrams()
