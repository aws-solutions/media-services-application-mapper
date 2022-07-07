"""
This module is provides unit tests for the tags.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch


@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestTags(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_update_diagrams(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_diagrams function
        """
        from chalicelib import tags
        tags.update_diagrams()

    def test_update_tiles(self, patched_env, patched_resource, patched_client):
        """
        Test the update_tiles function
        """
        from chalicelib import tags
        tags.update_tiles()
