"""
This module is provides unit tests for the cloudwatch_alarm.py module.
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
class TestCloudWatchAlarm(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """
    def test_subscribers_to_alarm(self, patched_env, patched_resource,
                                     patched_client):
        """
        Test the subscribers_to_alarm function
        """
        import cloudwatch_alarm
        with patch.object(cloudwatch_alarm.ALARMS_TABLE, 'query', side_effect=[{"Items":[{"ResourceArn": ARN}], "LastEvaluatedKey": "token"},
            {"Items":[{"ResourceArn": ARN}]}]):
            cloudwatch_alarm.subscribers_to_alarm("RegionAlarmName")
        
        with patch.object(cloudwatch_alarm.ALARMS_TABLE, 'query', side_effect=CLIENT_ERROR):
            cloudwatch_alarm.subscribers_to_alarm("RegionAlarmName")
            self.assertRaises(ClientError)


    def test_lambda_handler(self, patched_env, patched_resource,
                                     patched_client):
        """
        Test the lambda_handler function
        """
        import cloudwatch_alarm
        mocked_event = {"region": "us-east-1", "detail": {"alarmName": "alarmName"}}
        patched_resource.return_value.Alarm.return_value.alarm_value = "set"
        with patch.object(cloudwatch_alarm, 'subscribers_to_alarm', return_value=[ARN]):
            with patch.object(cloudwatch_alarm.ALARMS_TABLE, 'update_item', return_value={}):
                cloudwatch_alarm.lambda_handler(mocked_event, MagicMock())
        
        patched_resource.return_value.Alarm.side_effect = CLIENT_ERROR
        cloudwatch_alarm.lambda_handler(mocked_event, MagicMock())
        self.assertRaises(ClientError)
