"""
This module provides unit tests for the notes.py module.
"""

# pylint: disable=C0415

import unittest
from unittest.mock import patch, MagicMock

ARN = 'THIS-IS-NOT-AN-ARN'
NOTE = 'this is a note'

@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestNotes(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """
    def test_delete_all_notes(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the delete_all_notes function
        """
        from chalicelib import notes
        notes.delete_all_notes()

    def test_get_resource_notes(self, patched_env, patched_resource,
                              patched_client):
        """
        Test the get_resource_notes function
        """
        from chalicelib import notes
        notes.get_resource_notes(ARN)

    def test_get_all_notes(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the get_all_notes function
        """
        from chalicelib import notes
        notes.get_all_notes()

    def test_update_resource_notes(self, patched_env, patched_resource,
                              patched_client):
        """
        Test the update_resource_notes function
        """
        from chalicelib import notes
        mocked_notes = MagicMock()
        notes.update_resource_notes(ARN, mocked_notes)

    def test_delete_resource_notes(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the delete_resource_notes function
        """
        from chalicelib import notes
        notes.delete_resource_notes(ARN)

    def test_delete_all_notes_proxy(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the delete_all_notes_proxy function
        """
        from chalicelib import notes
        notes.delete_all_notes_proxy()
