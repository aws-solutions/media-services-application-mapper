"""
This module is provides unit tests for the periodic.py module.
"""

# pylint: disable=C0415,W0201

import requests
import unittest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "ClientError")

class TestPeriodic(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_update_alarms(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_alarms function
        """
        from chalicelib import periodic
        from chalicelib import cloudwatch
        result = periodic.update_alarms()
        self.assertTrue(result)
        # with actual return values
        with patch.object(cloudwatch, 'all_subscribed_alarms',
                            return_value=[{'Region': 'us-east-1', 'AlarmName': 'this-alarm'}]):
            result = periodic.update_alarms()
            self.assertTrue(result)
        # test with Exception
        with patch.object(cloudwatch, 'all_subscribed_alarms',  
                            side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "all_subscribed_alarms")):
            periodic.update_alarms()
            self.assertRaises(ClientError)

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_update_connections(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_connections function
        """
        from chalicelib import periodic
        from chalicelib import connections
        result = periodic.update_connections()
        self.assertTrue(result)
        with patch.object(connections, 'update_connection_ddb_items', 
                            side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "update_connections")):
            periodic.update_connections()
            self.assertRaises(ClientError)


    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_update_nodes(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_nodes function
        """
        from chalicelib import periodic
        original_function = periodic.update_nodes_generic
        periodic.update_nodes_generic = MagicMock()
        periodic.update_nodes()
        periodic.update_nodes_generic.assert_called_once()
        periodic.update_nodes_generic = original_function

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_update_ssm_nodes(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_ssm_nodes function
        """
        from chalicelib import periodic
        original_function = periodic.update_nodes_generic
        periodic.update_nodes_generic = MagicMock()
        periodic.update_ssm_nodes()
        periodic.update_nodes_generic.assert_called_once()
        periodic.update_nodes_generic = original_function

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_update_nodes_generic(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_nodes_generic function
        """
        from chalicelib import periodic
        from chalicelib import settings
        result = periodic.update_nodes_generic("function1", "function2", "some_key")
        self.assertIsNone(result)

        # None 
        with patch.object(settings, 'get_setting', return_value=None):
            result = periodic.update_nodes_generic("function1", "function2", "some_key")
            self.assertIsNone(result)

        # actual returned regions
        with patch.object(settings, 'get_setting', return_value=['global', 'us-west-2']):
            with self.assertRaises(TypeError): # this fails when calling the dummy functions
                periodic.update_nodes_generic("function1", "function2", "some_key")

        # Exception
        with patch.object(settings, 'get_setting',
                side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "update_nodes_generic")):
            result = periodic.update_nodes_generic("function1", "function2", "some_key")
            self.assertIsNone(result)

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_update_from_tags(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_from_tags function
        """
        from chalicelib import periodic
        tags = periodic.tags
        periodic.tags = MagicMock()
        periodic.update_from_tags()
        periodic.tags.update_diagrams.assert_called_once()
        periodic.tags.update_tiles.assert_called_once()
        periodic.tags = tags

    @patch('boto3.client')
    @patch('boto3.resource')
    @patch('os.environ')
    def test_ssm_run_command(self, patched_env, patched_resource,
                                patched_client):
        """
        Test the ssm_run_command function
        """
        from chalicelib import periodic
        
        doc_ids = {"DocumentIdentifiers": [{"Name": "DocName", "Tags": [{"Key": "MSAM-NodeType", "Value": "stuff"}]}]}
        patched_client.return_value.list_documents.return_value = doc_ids
        patched_client.return_value.send_command.return_value = {}
        patched_resource.return_value.Table.return_value.query.return_value.get.return_value = \
            [{"data": "{\"Tags\": {\"MSAM-NodeType\": \"ElementalLive\"}, \"Id\": \"someid\"}"}]
        result = periodic.ssm_run_command()
        self.assertIsNone(result)
        
        patched_client.return_value.list_documents.side_effect = CLIENT_ERROR
        periodic.ssm_run_command()
        self.assertRaises(ClientError)
        patched_client.return_value.send_command.side_effect = CLIENT_ERROR
        periodic.ssm_run_command()
        self.assertRaises(ClientError)


    @patch('boto3.resource')
    @patch('boto3.client')
    @patch('os.environ')
    def test_process_ssm_run_command(self, patched_env, patched_client, patched_resource):
        """
        Test the process_ssm_run_command function
        """
        from chalicelib import periodic
        mock_obj = MagicMock()
        mock_obj.get_log_events.return_value = {"events":[{"message": "<?xml version=\"1.0\"?><data></data>"}]}
        patched_client.return_value = mock_obj
        mocked_event = MagicMock()
        return_values = [{'detail': {'document-name': 'MSAMElementalLiveStatus', 
                'instance-id': 'id', 'status': 'Success',
                'command-id': 'command-id'}},
                {'detail': {'document-name': 'MSAMElementalLiveStatus', 
                'instance-id': 'id', 'status': 'Failed',
                'command-id': 'command-id'}},
                {'detail': {'document-name': 'MSAMSsmSystemStatus', 
                'instance-id': 'id', 'status': 'Success',
                'command-id': 'command-id'}},
                {'detail': {'document-name': 'MSAMElementalLiveActiveAlerts', 
                'instance-id': 'id', 'status': 'Success',
                'command-id': 'command-id'}},
                {'detail': {'document-name': 'MSAMElementalLiveCompletedEvents', 
                'instance-id': 'id', 'status': 'Success',
                'command-id': 'command-id'}},
                {'detail': {'document-name': 'MSAMElementalLiveErroredEvents', 
                'instance-id': 'id', 'status': 'Success',
                'command-id': 'command-id'}},
                {'detail': {'document-name': 'MSAMElementalLiveRunningEvents', 
                'instance-id': 'id', 'status': 'Success',
                'command-id': 'command-id'}}]
        for item in return_values:
            print(item)
            mocked_event.to_dict.return_value = item
            periodic.process_ssm_run_command(mocked_event)
            print()
        self.assertEqual(periodic.boto3.client.return_value.put_metric_data.call_count, len(return_values))
        periodic.boto3.client.return_value.put_metric_data.reset_mock()
        mock_obj.get_log_events.side_effect = CLIENT_ERROR
        periodic.process_ssm_run_command(mocked_event)
        self.assertEqual(periodic.boto3.client.return_value.put_metric_data.call_count, 0)
            
    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_generate_metrics(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the generate_metrics function
        """
        from chalicelib import periodic
        periodic.generate_metrics("stack_name")
        self.assertEqual(periodic.boto3.client.return_value.put_metric_data.call_count, len(periodic.MONITORED_SERVICES))

    @patch('boto3.client')
    @patch('boto3.resource')
    @patch('os.environ')
    def test_report_metrics(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the report_metrics function
        """
        from chalicelib import periodic
        from chalicelib import settings
        # invalid uuid
        with patch.object(settings, 'get_setting', return_value="invalid-uuid"):
            periodic.report_metrics("stack_name", 1)
            self.assertEqual(periodic.boto3.resource.return_value.Metric.return_value.get_statistics.call_count, 0)
        
        # valid uuid
        mock_req = MagicMock()
        mock_req.post.return_value.status_code = '200'
        with patch.object(settings, 'get_setting', return_value="1850ab37-92a6-4aef-877d-a82cc28a01b7"):
            with patch.object(requests, 'post', return_value=mock_req):
                periodic.SOLUTION_ID = "AwsSolution/SO0048/v1.0.0"
                periodic.report_metrics("stack_name", 1)
                self.assertEqual(periodic.boto3.resource.return_value.Metric.return_value.get_statistics.call_count, 14)
