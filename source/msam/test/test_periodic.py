"""
This module is provides unit tests for the periodic.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError


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
        periodic.update_alarms()
        # with actual return values
        with patch.object(cloudwatch, 'all_subscribed_alarms',
                            return_value=[{'Region': 'us-east-1', 'AlarmName': 'this-alarm'}]):
            periodic.update_alarms()
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
        periodic.update_connections()
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
        periodic.update_nodes()

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_update_ssm_nodes(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_ssm_nodes function
        """
        from chalicelib import periodic
        periodic.update_ssm_nodes()

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
        periodic.update_nodes_generic("function1", "function2", "some_key")

        # None 
        with patch.object(settings, 'get_setting', return_value=None):
            periodic.update_nodes_generic("function1", "function2", "some_key")

        # actual returned regions
        with patch.object(settings, 'get_setting', return_value=['global', 'us-west-2']):
            with self.assertRaises(TypeError): # this fails when calling the dummy functions
                periodic.update_nodes_generic("function1", "function2", "some_key")

        # Exception
        with patch.object(settings, 'get_setting',
                side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "update_nodes_generic")):
            periodic.update_nodes_generic("function1", "function2", "some_key")

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
    def test_update_from_tags(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_from_tags function
        """
        from chalicelib import periodic
        periodic.update_from_tags()

    @patch('boto3.client')
    @patch('boto3.resource')
    @patch('os.environ')
    def test_ssm_run_command(self, patched_env, patched_resource,
                                patched_client):
        """
        Test the ssm_run_command function
        """
        from chalicelib import periodic
        patched_resource.return_value.Table.return_value.query.return_value.get.return_value = \
            [{"data": "{\"Tags\": {\"MSAM-NodeType\": \"ElementalLive\"}, \"Id\": \"someid\"}"}]
        periodic.ssm_run_command()


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

    @patch('os.environ')
    @patch('boto3.resource')
    @patch('boto3.client')
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
        
        # # valid uuid
        # with patch.object(settings, 'get_setting', return_value="1850ab37-92a6-4aef-877d-a82cc28a01b7"):
        #     with patch.dict(os.environ, {"SOLUTION_ID": "AwsSolution/SO0048/v1.0.0"}, clear=True):
        #         periodic.report_metrics("stack_name", 1)
