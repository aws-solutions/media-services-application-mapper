"""
This module is provides unit tests for the channels.py module.
"""

# pylint: disable=C0415

import unittest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

SERVICE = 'medialive-channel'
REGION = 'us-west-2'
ARN = 'THIS-IS-NOT-AN-ARN'
CHANNEL_NAME = "NO-CHANNEL"
NODE_IDS = ["A", "B", "C", "Z"]

class TestChannels(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def tearDown(self):
        from chalicelib import channels
        channels.DYNAMO_RESOURCE.reset_mock()

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_delete_channel_nodes(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the delete_channel_nodes function
        """
        from chalicelib import channels
        from chalicelib import settings
        channels.delete_channel_nodes(CHANNEL_NAME)
        
        mock_table = MagicMock()
        mock_table.query.return_value = {"Items": [{"channel": "channel_name", "id": "channel_id"}]}
        mock_table.delete_item.return_value = {}
        patched_resource.return_value.Table.return_value = mock_table

        # test CHANNEL_NAME not in list
        with patch.object(settings, 'get_setting', return_value=[CHANNEL_NAME]):
            channels.delete_channel_nodes(CHANNEL_NAME)
        
        mock_table.query.side_effect = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "query")
        channels.delete_channel_nodes(CHANNEL_NAME)
        self.assertRaises(ClientError)

        with patch.object(settings, 'get_setting', 
                        side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "get_setting")):
            channels.delete_channel_nodes(CHANNEL_NAME)
            self.assertRaises(ClientError)


    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_get_channel_list(self, patched_env, patched_resource,
                              patched_client):
        """
        Test the get_channel_list function
        """                    
        from chalicelib import channels
        channels.get_channel_list()
        channels.DYNAMO_RESOURCE.Table.assert_called_once_with('settings_table')
        channels.DYNAMO_RESOURCE.Table.return_value.get_item.assert_called_once_with(Key={"id": "channels"})


    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_set_channel_nodes(self, patched_env, patched_resource,
                               patched_client):
        """
        Test the set_channel_nodes function
        """                    
        from chalicelib import channels
        from chalicelib import settings
        channels.set_channel_nodes(CHANNEL_NAME, NODE_IDS)
        channels.DYNAMO_RESOURCE.Table.assert_any_call('channels_table')
        channels.DYNAMO_RESOURCE.Table.assert_any_call('settings_table')
        channels.DYNAMO_RESOURCE.Table.return_value.get_item.assert_called_once_with(Key={'id': 'channels'})
        channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'channel': 'NO-CHANNEL', 'id': 'A'})
        channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'channel': 'NO-CHANNEL', 'id': 'B'})
        channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'channel': 'NO-CHANNEL', 'id': 'C'})
        channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'channel': 'NO-CHANNEL', 'id': 'Z'})
        channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'id': 'channels', 'value': ['NO-CHANNEL']})    
        channels.DYNAMO_RESOURCE.reset_mock()
        # test exception
        with patch.object(settings, 'get_setting', 
                    side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "get_setting")):
            channels.set_channel_nodes(CHANNEL_NAME, NODE_IDS)
            channels.DYNAMO_RESOURCE.Table.assert_called_once_with('channels_table')
            channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'channel': 'NO-CHANNEL', 'id': 'A'})
            channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'channel': 'NO-CHANNEL', 'id': 'B'})
            channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'channel': 'NO-CHANNEL', 'id': 'C'})
            channels.DYNAMO_RESOURCE.Table.return_value.put_item.assert_any_call(Item={'channel': 'NO-CHANNEL', 'id': 'Z'})


    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_get_channel_nodes(self, patched_env, patched_resource,
                               patched_client):
        """
        Test the get_channel_nodes function
        """                    
        from chalicelib import channels
        mock_table = MagicMock()
        mock_table.query.return_value = {"Items": [{"data": "data", "arn": "some-arn"}]}
        mock_table.delete_item.return_value = {}
        patched_resource.return_value.Table.return_value = mock_table
        channels.get_channel_nodes(CHANNEL_NAME)
        channels.DYNAMO_RESOURCE.Table.assert_called_once_with('channels_table')
        channels.DYNAMO_RESOURCE.Table.return_value.query.assert_called_once()
        channels.DYNAMO_RESOURCE.Table.reset_mock()

        # mock_table.query.side_effect = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "query")
        with patch.object(patched_resource, 'query', side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "query")):
            channels.get_channel_nodes(CHANNEL_NAME)
            self.assertRaises(ClientError)
        
        mock_table.Table.side_effect = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "query")
        channels.get_channel_nodes(CHANNEL_NAME)
        self.assertRaises(ClientError)

    
    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_delete_all_channels(self, patched_env, patched_resource,
                                 patched_client):
        """
        Test the delete_all_channels function
        """                    
        from chalicelib import channels
        from chalicelib import settings
        mock_table = MagicMock()
        mock_table.scan.return_value = {"Items": [{"channel": "channel_name", "id": "channel_id"}]}
        mock_table.delete_item.return_value = {}
        patched_resource.return_value.Table.return_value = mock_table

        # test CHANNEL_NAME not in list
        with patch.object(settings, 'put_setting', return_value=[CHANNEL_NAME]):
            channels.delete_all_channels()
            channels.DYNAMO_RESOURCE.Table.assert_called_once_with('channels_table')
            channels.DYNAMO_RESOURCE.Table.return_value.scan.assert_called_once_with(ProjectionExpression='channel,id')
            channels.DYNAMO_RESOURCE.Table.reset_mock()
        
        with patch.object(settings, 'put_setting', 
                        side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "put_setting")):
            channels.delete_all_channels()
            self.assertRaises(ClientError)
