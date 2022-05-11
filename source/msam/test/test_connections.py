"""
This module is provides unit tests for the cloudwatch.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch


@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestConnections(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_connection_item(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the connection_item function
        """
        from chalicelib import connections
        item = connections.connection_item("arn", "from", "to", "service",
                                           {"config": True})
        self.assertTrue(
            item.get("arn") == "arn" and item.get("from") == "from"
            and item.get("to") == "to" and item.get("service") == "service")

    def test_connection_to_ddb_item(self, patched_env, patched_resource,
                                    patched_client):
        """
        Test the connection_to_ddb_item function
        """
        from chalicelib import connections
        item = connections.connection_to_ddb_item("from", "to", "service", {
            "config": True,
            "pipeline": "0"
        })
        self.assertTrue(
            item.get("arn") == "from:to" and item.get("from") == "from"
            and item.get("to") == "to" and item.get("service") == "service")

    def test_connection_to_ddb_item_pl(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the connection_to_ddb_item_pl function
        """
        from chalicelib import connections
        item = connections.connection_to_ddb_item_pl("from", "to", "service", {
            "config": True,
            "pipeline": "1"
        })
        self.assertTrue(
            item.get("arn") == "from:to:1" and item.get("from") == "from"
            and item.get("to") == "to" and item.get("service") == "service")

    def test_fetch_running_pipelines_count(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the fetch_running_pipelines_count function
        """
        from chalicelib import connections
        count = connections.fetch_running_pipelines_count(
            {"ChannelClass": "STANDARD"})
        self.assertTrue(count == 2)
        count = connections.fetch_running_pipelines_count(
            {"ChannelClass": "NOT-STANDARD"})
        self.assertTrue(count == 1)

    @patch('chalicelib.cache')
    def test_update_connection_ddb_items(self, patched_env, patched_resource,
                                           patched_client, patched_cache):
        """
        Test the update_connection_ddb_items function
        """
        from chalicelib import connections
        connections.update_connection_ddb_items()
