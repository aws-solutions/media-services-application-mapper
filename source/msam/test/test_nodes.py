"""
This module is provides unit tests for the cloudwatch.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch


@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestNodes(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_update_regional_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the update_regional_ddb_items function
        """
        from chalicelib import nodes
        nodes.update_regional_ddb_items("us-east-1")
