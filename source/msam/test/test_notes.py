"""
This module provides unit tests for the notes.py module.
"""

# pylint: disable=C0415

import unittest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

ARN = 'THIS-IS-NOT-AN-ARN'
NOTE = {"resource_arn": ARN, "note": "this is a note"}
CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "ClientError")
ITEMS = {"Items": [NOTE]}
ITEMS_WITH_TOKEN = {"Items": [NOTE], "LastEvaluatedKey": "somekey"}

@patch('boto3.client')
@patch('boto3.resource')
@patch('os.environ')
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
        with patch.object(notes.NOTES_TABLE, 'scan', side_effect=[ITEMS_WITH_TOKEN, ITEMS]):
            with patch.object(notes.NOTES_TABLE, 'delete_item', return_value = {}):
                notes.delete_all_notes()
        with patch.object(notes.NOTES_TABLE, 'scan', side_effect=CLIENT_ERROR):
            notes.delete_all_notes()

    def test_get_resource_notes(self, patched_env, patched_resource,
                              patched_client):
        """
        Test the get_resource_notes function
        """
        from chalicelib import notes
        with patch.object(notes.NOTES_TABLE, 'query', return_value=ITEMS):
            notes.get_resource_notes(ARN)
        
        with patch.object(notes.NOTES_TABLE, 'query', side_effect=CLIENT_ERROR):
            notes.get_resource_notes(ARN)
        self.assertRaises(ClientError)

    def test_get_all_notes(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the get_all_notes function
        """
        from chalicelib import notes
        with patch.object(notes.NOTES_TABLE, 'scan', side_effect=[ITEMS_WITH_TOKEN, ITEMS]):
            notes.get_all_notes()
        with patch.object(notes.NOTES_TABLE, 'scan', side_effect=CLIENT_ERROR):
            notes.get_all_notes()
        self.assertRaises(ClientError)


    def test_update_resource_notes(self, patched_env, patched_resource,
                              patched_client):
        """
        Test the update_resource_notes function
        """
        from chalicelib import notes
        mocked_notes = MagicMock()
        notes.update_resource_notes(ARN, mocked_notes)
        with patch.object(notes.NOTES_TABLE, 'put_item', side_effect=CLIENT_ERROR):
            notes.update_resource_notes(ARN, mocked_notes)

    def test_delete_resource_notes(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the delete_resource_notes function
        """
        from chalicelib import notes
        with patch.object(notes.NOTES_TABLE, 'delete_item', side_effect=CLIENT_ERROR):
            notes.delete_resource_notes(ARN)

    def test_delete_all_notes_proxy(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the delete_all_notes_proxy function
        """
        from chalicelib import notes
        with patch.object(notes.LAMBDA_CLIENT, 'invoke', side_effect=CLIENT_ERROR):
            notes.delete_all_notes_proxy()
