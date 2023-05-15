"""
This module is provides unit tests for the cloudwatch.py module.
"""

# pylint: disable=C0415,W0201

from datetime import datetime
import unittest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

ALARM = {
    'AlarmArn': '1',
    'AlarmName': '2',
    'MetricName': '3',
    'Namespace': '4',
    'StateValue': '5',
    'StateUpdatedTimestamp': datetime.now()
}
ARN = "arn:msam:user-defined-node:global:111122223333:10AA8D40-2B6F-44FA-AA67-6B909F8B1DB9"
CHANNEL_NAME = "NO-CHANNEL"
EVENT = {"Records": []}
NODE_IDS = ["A", "B", "C", "Z"]
REGION = 'us-west-2'
SERVICE = 'medialive-channel'
SOURCE = "aws.medialive"
SUBSCRIBER = "arn:msam:user-defined-node:global:111122223333:10AA8D40-2B6F-44FA-AA67-6B909F8B1DB9"
ITEMS = {"Items": [{"Region": "us-east-1", "AlarmName": "alarm_name", "RegionAlarmName": "region:alarm", "ResourceArn": "some-arn"}]}
CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "ClientError")

@patch('boto3.client')
@patch('boto3.resource')
@patch('os.environ')
class TestCloudWatch(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """
    def test_update_alarm_records(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the update_alarm_records function
        """
        from chalicelib import cloudwatch
        # no namespace
        cloudwatch.update_alarm_records(REGION, {"AlarmName": "TestAlarm"}, [])
        cloudwatch.boto3.resource.assert_called_once_with('dynamodb', config=cloudwatch.MSAM_BOTO3_CONFIG)
        cloudwatch.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        cloudwatch.boto3.resource.reset_mock()

        mock_table = MagicMock()
        mock_table.put_item.return_value = {}
        patched_resource.return_value.Table.return_value = mock_table
        # with namespace
        cloudwatch.update_alarm_records(REGION, ALARM, [ARN])
        cloudwatch.boto3.resource.return_value.Table.return_value.put_item.assert_called_once()
        # exception
        mock_table.put_item.side_effect = CLIENT_ERROR
        cloudwatch.update_alarm_records(REGION, ALARM, [ARN])
        self.assertRaises(ClientError)


    def test_update_alarm_subscriber(self, patched_env, patched_resource,
                                     patched_client):
        """
        Test the update_alarm_subscriber function
        """
        from chalicelib import cloudwatch
        mock_obj = MagicMock()
        mock_obj.describe_alarms.return_value = {"CompositeAlarms": [ALARM], "MetricAlarms": [ALARM]}
        patched_client.return_value = mock_obj
        original_method = cloudwatch.update_alarm_records
        cloudwatch.update_alarm_records = MagicMock()
        cloudwatch.update_alarm_subscriber(REGION, ALARM, SUBSCRIBER)
        cloudwatch.boto3.client.assert_called_once_with(
            'cloudwatch',
            region_name=REGION,
            config=cloudwatch.MSAM_BOTO3_CONFIG
        )
        self.assertEqual(cloudwatch.update_alarm_records.call_count, 2)
        cloudwatch.update_alarm_records.assert_any_call(
            'us-west-2',
            ALARM,
            [SUBSCRIBER]
        )
        cloudwatch.update_alarm_records = original_method
        
        mock_obj.describe_alarms.side_effect = CLIENT_ERROR
        cloudwatch.update_alarm_subscriber(REGION, ALARM, SUBSCRIBER)
        self.assertRaises(ClientError)


    def test_update_alarms(self, patched_env, patched_resource,
                           patched_client):
        """
        Test the update_alarms function
        """
        from chalicelib import cloudwatch
        mock_obj = MagicMock()
        mock_obj.describe_alarms.return_value = {"CompositeAlarms": [ALARM], "MetricAlarms": [ALARM]}
        patched_client.return_value = mock_obj
        original_method = cloudwatch.update_alarm_records
        cloudwatch.update_alarm_records = MagicMock()
        cloudwatch.update_alarms(REGION, [ALARM])
        self.assertEqual(cloudwatch.update_alarm_records.call_count, 2)
        cloudwatch.update_alarm_records.assert_any_call(
            'us-west-2',
            ALARM,
            []
        )
        cloudwatch.update_alarm_records = original_method

        mock_obj.describe_alarms.side_effect = CLIENT_ERROR
        cloudwatch.update_alarms(REGION, [ALARM])
        self.assertRaises(ClientError)


    def test_alarms_for_subscriber(self, patched_env, patched_resource,
                                   patched_client):
        """
        Test the alarms_for_subscriber function
        """
        from chalicelib import cloudwatch
        
        mock_table = MagicMock()
        mock_table.query.return_value = ITEMS
        patched_resource.return_value.Table.return_value = mock_table
        items = cloudwatch.alarms_for_subscriber(SUBSCRIBER)
        cloudwatch.boto3.resource.assert_called_once()
        cloudwatch.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        cloudwatch.boto3.resource.return_value.Table.return_value.query.assert_called_once()
        self.assertEqual(items, [
            {
                'Region': 'region',
                'AlarmName': 'alarm',
                'RegionAlarmName': 'region:alarm',
                'ResourceArn': 'some-arn'
            }
        ])

        mock_table.query.side_effect = CLIENT_ERROR
        cloudwatch.alarms_for_subscriber(SUBSCRIBER)
        self.assertRaises(ClientError)


    def test_all_subscribed_alarms(self, patched_env, patched_resource,
                                   patched_client):
        """
        Test the all_subscribed_alarms function
        """
        from chalicelib import cloudwatch
        mock_table = MagicMock()
        mock_table.scan.return_value = ITEMS
        patched_resource.return_value.Table.return_value = mock_table
        alarms = cloudwatch.all_subscribed_alarms()
        cloudwatch.boto3.resource.assert_called_once()
        cloudwatch.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        self.assertEqual(alarms, [{
            'Region': 'region',
            'AlarmName': 'alarm'
        }])
        
        mock_table.scan.side_effect = CLIENT_ERROR
        cloudwatch.all_subscribed_alarms()
        self.assertRaises(ClientError)

    def test_filtered_alarm(self, patched_env, patched_resource,
                            patched_client):
        """
        Test the filtered_alarm function
        """
        from chalicelib import cloudwatch
        cloudwatch.filtered_alarm(ALARM)

    def test_get_cloudwatch_alarms_region(self, patched_env, patched_resource,
                                          patched_client):
        """
        Test the get_cloudwatch_alarms_region function
        """
        from chalicelib import cloudwatch
        mock_obj = MagicMock()
        mock_obj.describe_alarms.return_value =  {"CompositeAlarms": [ALARM], "MetricAlarms": [ALARM]}
        patched_client.return_value = mock_obj
        alarms = cloudwatch.get_cloudwatch_alarms_region(REGION)
        self.assertEqual(len(alarms), 2)

        mock_obj.describe_alarms.side_effect = CLIENT_ERROR
        cloudwatch.get_cloudwatch_alarms_region(REGION)
        self.assertRaises(ClientError)

    def test_get_cloudwatch_events_state(self, patched_env, patched_resource,
                                         patched_client):
        """
        Test the get_cloudwatch_events_state function
        """
        from chalicelib import cloudwatch
        cloudwatch.get_cloudwatch_events_state("set")
        cloudwatch.boto3.resource.assert_called_once()
        cloudwatch.boto3.resource.return_value.Table.assert_called_once_with('events_table')
        cloudwatch.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_get_cloudwatch_events_state_source(self, patched_env,
                                                patched_resource,
                                                patched_client):
        """
        Test the get_cloudwatch_events_state_source function
        """
        from chalicelib import cloudwatch
        cloudwatch.get_cloudwatch_events_state_source("set", SOURCE)
        cloudwatch.boto3.resource.assert_called_once()
        cloudwatch.boto3.resource.return_value.Table.assert_called_once_with('events_table')
        cloudwatch.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_get_cloudwatch_events_resource(self, patched_env,
                                            patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_resource function
        """
        from chalicelib import cloudwatch
        mock_table = MagicMock()
        mock_table.query.return_value = ITEMS
        patched_resource.return_value.Table.return_value = mock_table
        cloudwatch.get_cloudwatch_events_resource(ARN, 1, 0)
        cloudwatch.get_cloudwatch_events_resource(ARN, 1, 1)
        self.assertEqual(cloudwatch.boto3.resource.return_value.Table.return_value.query.call_count, 2)

        mock_table.query.side_effect = CLIENT_ERROR
        cloudwatch.get_cloudwatch_events_resource(ARN)
        self.assertRaises(ClientError)

    def test_incoming_cloudwatch_alarm(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the incoming_cloudwatch_alarm function
        """
        from chalicelib import cloudwatch
        SNS_ARN = "arn:aws:sns:us-east-1:123456789012:mystack-mytopic-NZJ5JSMVGFIE"
        EVENT = {"Records": [{"Sns": {"TopicArn": SNS_ARN, "Message": "\"this message\""}}]}
        with patch.object(cloudwatch, 'subscribers_to_alarm', return_value=[SUBSCRIBER]):
            cloudwatch.incoming_cloudwatch_alarm(EVENT, None)
            self.assertEqual(cloudwatch.boto3.resource.return_value.Table.return_value.put_item.call_count, 1)
        #exception
        with patch.object(cloudwatch, 'subscribers_to_alarm', side_effect=CLIENT_ERROR):
            cloudwatch.incoming_cloudwatch_alarm(EVENT, None)
        self.assertRaises(ClientError)

    def test_subscribe_resource_to_alarm(self, patched_env, patched_resource,
                                         patched_client):
        """
        Test the subscribe_resource_to_alarm function
        """
        from chalicelib import cloudwatch
        request_obj = MagicMock()
        request_obj.json_body = [ARN]
        resources = cloudwatch.subscribe_resource_to_alarm(request_obj, "alarm", REGION)
        self.assertTrue(resources)

        mock_table = MagicMock()
        mock_table.put_item.side_effect = CLIENT_ERROR
        patched_resource.return_value.Table.return_value = mock_table
        cloudwatch.subscribe_resource_to_alarm(request_obj, "alarm", REGION)
        self.assertRaises(ClientError)

    def test_subscribed_with_state(self, patched_env, patched_resource,
                                   patched_client):
        """
        Test the subscribed_with_state function
        """
        from chalicelib import cloudwatch
        mock_table = MagicMock()
        mock_table.query.return_value = {"Items": [{"ResourceArn": ARN}, {"ResourceArn": ARN}]}
        patched_resource.return_value.Table.return_value = mock_table
        resources = cloudwatch.subscribed_with_state("ALARM")
        self.assertEqual(resources, [{
            'ResourceArn': 'arn:msam:user-defined-node:global:111122223333:10AA8D40-2B6F-44FA-AA67-6B909F8B1DB9',
            'AlarmCount': 2
        }])

        mock_table.query.side_effect = CLIENT_ERROR
        cloudwatch.subscribed_with_state("ALARM")
        self.assertRaises(ClientError)

    def test_subscribers_to_alarm(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the subscribers_to_alarm function
        """
        from chalicelib import cloudwatch
        mock_table = MagicMock()
        mock_table.query.return_value = {"Items": [{"ResourceArn": ARN}]}
        patched_resource.return_value.Table.return_value = mock_table
        cloudwatch.subscribers_to_alarm("TestAlarm", REGION)
        cloudwatch.boto3.resource.assert_called_once()
        cloudwatch.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        cloudwatch.boto3.resource.return_value.Table.return_value.query.assert_called_once()
        
        mock_table.query.side_effect = CLIENT_ERROR
        cloudwatch.subscribers_to_alarm("TestAlarm", REGION)
        self.assertRaises(ClientError)

    def test_unsubscribe_resource_from_alarm(self, patched_env,
                                             patched_resource, patched_client):
        """
        Test the unsubscribe_resource_from_alarm function
        """
        from chalicelib import cloudwatch

        request_obj = MagicMock()
        request_obj.json_body = [ARN]
        result = cloudwatch.unsubscribe_resource_from_alarm(request_obj, "alarm", REGION)
        cloudwatch.boto3.resource.assert_called_once()
        cloudwatch.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        cloudwatch.boto3.resource.return_value.Table.return_value.delete_item.assert_called_once()
        self.assertTrue(result)

        mock_table = MagicMock()
        mock_table.delete_item.side_effect = CLIENT_ERROR
        patched_resource.return_value.Table.return_value = mock_table
        result = cloudwatch.unsubscribe_resource_from_alarm(request_obj, "alarm", REGION)
        self.assertRaises(ClientError)        
        self.assertFalse(result)
        
    def test_delete_all_subscriptions(self, patched_env, patched_resource,
                                      patched_client):
        """
        Test the delete_all_subscriptions function
        """
        from chalicelib import cloudwatch
        mock_table = MagicMock()
        mock_table.scan.return_value = ITEMS
        patched_resource.return_value.Table.return_value = mock_table
        result = cloudwatch.delete_all_subscriptions()
        cloudwatch.boto3.resource.assert_called_once()
        cloudwatch.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        cloudwatch.boto3.resource.return_value.Table.return_value.delete_item.assert_called_once()
        self.assertEqual(result, {'message': 'done'})
        
        mock_table.scan.side_effect = CLIENT_ERROR
        result = cloudwatch.delete_all_subscriptions()
        self.assertTrue('error' in result['message'])
        self.assertRaises(ClientError)
