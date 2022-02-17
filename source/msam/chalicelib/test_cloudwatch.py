"""
This module is provides unit tests for the cloudwatch.py module.
"""

# pylint: disable=C0415,W0201

from datetime import datetime
import unittest
from unittest.mock import patch

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


@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
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
        cloudwatch.update_alarm_records(REGION, {"AlarmName": "TestAlarm"}, [])

    def test_update_alarm_subscriber(self, patched_env, patched_resource,
                                     patched_client):
        """
        Test the update_alarm_subscriber function
        """
        from chalicelib import cloudwatch
        cloudwatch.update_alarm_subscriber(REGION, {"AlarmName": "TestAlarm"},
                                           SUBSCRIBER)

    def test_update_alarms(self, patched_env, patched_resource,
                           patched_client):
        """
        Test the update_alarms function
        """
        from chalicelib import cloudwatch
        cloudwatch.update_alarms(REGION, ["TestAlarm"])

    def test_alarms_for_subscriber(self, patched_env, patched_resource,
                                   patched_client):
        """
        Test the alarms_for_subscriber function
        """
        from chalicelib import cloudwatch
        cloudwatch.alarms_for_subscriber(SUBSCRIBER)

    def test_all_subscribed_alarms(self, patched_env, patched_resource,
                                   patched_client):
        """
        Test the all_subscribed_alarms function
        """
        from chalicelib import cloudwatch
        cloudwatch.all_subscribed_alarms()

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
        cloudwatch.get_cloudwatch_alarms_region(REGION)

    def test_get_cloudwatch_events_state(self, patched_env, patched_resource,
                                         patched_client):
        """
        Test the get_cloudwatch_events_state function
        """
        from chalicelib import cloudwatch
        cloudwatch.get_cloudwatch_events_state("set")

    def test_get_cloudwatch_events_state_source(self, patched_env,
                                                patched_resource,
                                                patched_client):
        """
        Test the get_cloudwatch_events_state_source function
        """
        from chalicelib import cloudwatch
        cloudwatch.get_cloudwatch_events_state_source("set", SOURCE)

    def test_get_cloudwatch_events_state_groups(self, patched_env,
                                                patched_resource,
                                                patched_client):
        """
        Test the get_cloudwatch_events_state_groups function
        """
        from chalicelib import cloudwatch
        cloudwatch.get_cloudwatch_events_state_groups("set")

    def test_get_cloudwatch_events_resource(self, patched_env,
                                            patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_resource function
        """
        from chalicelib import cloudwatch
        cloudwatch.get_cloudwatch_events_resource(ARN)

    def test_incoming_cloudwatch_alarm(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the incoming_cloudwatch_alarm function
        """
        from chalicelib import cloudwatch
        cloudwatch.incoming_cloudwatch_alarm(EVENT, None)

    def test_subscribe_resource_to_alarm(self, patched_env, patched_resource,
                                         patched_client):
        """
        Test the subscribe_resource_to_alarm function
        """
        from chalicelib import cloudwatch

        class alarm_dict(dict):
            """
            Testing class of dictionary with attributes
            """

        d = alarm_dict()
        d.json_body = []
        cloudwatch.subscribe_resource_to_alarm(d, "alarm", REGION)

    def test_subscribed_with_state(self, patched_env, patched_resource,
                                   patched_client):
        """
        Test the subscribed_with_state function
        """
        from chalicelib import cloudwatch
        cloudwatch.subscribed_with_state("ALARM")

    def test_subscribers_to_alarm(self, patched_env, patched_resource,
                                  patched_client):
        """
        Test the subscribers_to_alarm function
        """
        from chalicelib import cloudwatch
        cloudwatch.subscribers_to_alarm("TestAlarm", REGION)

    def test_unsubscribe_resource_from_alarm(self, patched_env,
                                             patched_resource, patched_client):
        """
        Test the unsubscribe_resource_from_alarm function
        """
        from chalicelib import cloudwatch

        class alarm_dict(dict):
            """
            Testing class of dictionary with attributes
            """

        d = alarm_dict()
        d.json_body = []
        cloudwatch.unsubscribe_resource_from_alarm(d, "alarm", REGION)

    def test_delete_all_subscriptions(self, patched_env, patched_resource,
                                      patched_client):
        """
        Test the delete_all_subscriptions function
        """
        from chalicelib import cloudwatch
        cloudwatch.delete_all_subscriptions()
