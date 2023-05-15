"""
This module is provides unit tests for the app.py module.
"""

# pylint: disable=C0415,W0201,R0904

import os
import unittest
from unittest.mock import patch, MagicMock

os.environ["ALARMS_TABLE_NAME"] = "alarms_table"
os.environ["CHANNELS_TABLE_NAME"] = "channels_table"
os.environ["CONTENT_TABLE_NAME"] = "content_table"
os.environ["EVENTS_TABLE_NAME"] = "events_table"
os.environ["LAYOUT_TABLE_NAME"] = "layout_table"
os.environ["SETTINGS_TABLE_NAME"] = "settings_table"
os.environ["CACHE_ITEM_TTL"] = "600"
os.environ["BUILD_STAMP"] = "1234567890"
os.environ["VERSION"] = "v1.0.0"
os.environ["ALARMS_TABLE_NAME"] = "alarms_table"
os.environ["SOLUTION_ID"] = "SO0166"
os.environ["CLOUDWATCH_EVENTS_TABLE_NAME"] = "cw_table"
os.environ["NOTES_TABLE_NAME"] = "notes_table"
os.environ["DELETE_NOTES_FUNCTION"] = "some_function"

@patch('boto3.client')
@patch('boto3.resource')
class TestApp(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def tearDown(self):
        import app
        app.DYNAMO_CLIENT.reset_mock()
        app.DYNAMO_RESOURCE.reset_mock()

    def test_get_view_layout(self, patched_resource, patched_client):
        """
        Test the get_view_layout function
        """
        import app
        app.get_view_layout("any_view")
        app.DYNAMO_RESOURCE.Table.assert_called_once_with('layout_table')
        app.DYNAMO_RESOURCE.Table.return_value.query.assert_called_once()

    def test_delete_view_layout(self, patched_resource, patched_client):
        """
        Test the delete_view_layout function
        """
        import app
        app.delete_view_layout("any_view", "node_id")
        app.DYNAMO_RESOURCE.Table.assert_called_once_with('layout_table')
        app.DYNAMO_RESOURCE.Table.return_value.delete_item.assert_called_once_with(Key={"view": "any_view", "id": "node_id"})

    def test_set_view_layout(self, patched_resource, patched_client):
        """
        Test the set_view_layout function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.set_view_layout()
            app.DYNAMO_RESOURCE.Table.assert_called_once_with('layout_table')

    def test_delete_layout_views(self, patched_resource, patched_client):
        """
        Test the delete_layout_views function
        """
        import app
        app.delete_layout_views()
        app.DYNAMO_RESOURCE.Table.assert_any_call('layout_table')
        app.DYNAMO_RESOURCE.Table.assert_any_call('settings_table')
        app.DYNAMO_RESOURCE.Table.return_value.put_item.assert_called_with(Item={"id": "diagrams", "value": []})
        app.DYNAMO_RESOURCE.Table.return_value.scan.assert_called_with(ExpressionAttributeNames={ "#v": "view", "#i": "id" }, ProjectionExpression="#v,#i")
        

    def test_get_channel_list(self, patched_resource, patched_client):
        """
        Test the get_channel_list function
        """
        import app
        app.get_channel_list()
        app.DYNAMO_RESOURCE.Table.assert_called_once_with('settings_table')
        app.DYNAMO_RESOURCE.Table.return_value.get_item.assert_called_once_with(Key={"id": "channels"})

    def test_delete_all_channels(self, patched_resource, patched_client):
        """
        Test the delete_all_channels function
        """
        import app
        app.delete_all_channels()
        app.DYNAMO_RESOURCE.Table.assert_any_call('channels_table')
        app.DYNAMO_RESOURCE.Table.assert_any_call('settings_table')
        app.DYNAMO_RESOURCE.Table.return_value.put_item.assert_called_once_with(Item={'id': 'channels', 'value': []})
        app.DYNAMO_RESOURCE.Table.return_value.scan.assert_called_once_with(ProjectionExpression='channel,id')

    def test_set_channel_nodes(self, patched_resource, patched_client):
        """
        Test the set_channel_nodes function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.set_channel_nodes("channel_name")
            app.DYNAMO_RESOURCE.Table.assert_any_call('channels_table')
            app.DYNAMO_RESOURCE.Table.assert_any_call('settings_table')
            app.DYNAMO_RESOURCE.Table.return_value.get_item.assert_called_once_with(Key={'id': 'channels'})
            app.DYNAMO_RESOURCE.Table.return_value.put_item.assert_called_once_with(Item={'id': 'channels', 'value': ['channel_name']})

    def test_get_channel_nodes(self, patched_resource, patched_client):
        """
        Test the get_channel_nodes function
        """
        import app
        app.get_channel_nodes("channel_name")
        app.DYNAMO_RESOURCE.Table.assert_called_once_with('channels_table')
        app.DYNAMO_RESOURCE.Table.return_value.query.assert_called_once()


    def test_delete_channel_nodes(self, patched_resource, patched_client):
        """
        Test the delete_channel_nodes function
        """
        import app
        app.delete_channel_nodes("channel_name")
        app.DYNAMO_RESOURCE.Table.assert_any_call('channels_table')
        app.DYNAMO_RESOURCE.Table.assert_any_call('settings_table')
        app.DYNAMO_RESOURCE.Table.return_value.get_item.assert_called_once_with(Key={'id': 'channels'})
        app.DYNAMO_RESOURCE.Table.return_value.query.assert_called_once()
        app.DYNAMO_RESOURCE.Table.return_value.query.return_value.get.assert_called_once_with('Items', [])

    def test_application_settings(self, patched_resource, patched_client):
        """
        Test the application_settings function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            settings = app.application_settings("channel_name")
            self.assertEqual(settings, {})

    def test_cached_by_service_region(self, patched_resource, patched_client):
        """
        Test the cached_by_service_region function
        """
        import app
        app.cached_by_service_region("service", "us-east-1")
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_cached_by_service(self, patched_resource, patched_client):
        """
        Test the cached_by_service function
        """
        import app
        app.cached_by_service("service")
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_cached_by_arn(self, patched_resource, patched_client):
        """
        Test the cached_by_arn function
        """
        import app
        app.cached_by_arn("service")
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_put_cached_data(self, patched_resource, patched_client):
        """
        Test the put_cached_data function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.put_cached_data()
            app.boto3.resource.assert_called_once()
            app.boto3.resource.return_value.Table.assert_called_once_with('content_table')

    def test_delete_cached_data(self, patched_resource, patched_client):
        """
        Test the delete_cached_data function
        """
        import app
        app.delete_cached_data("service")
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        app.boto3.resource.return_value.Table.return_value.delete_item.assert_called_once()

    def test_regions(self, patched_resource, patched_client):
        """
        Test the regions function
        """
        import app
        app.regions()
        app.boto3.client.assert_called_once()
        app.boto3.client.return_value.describe_regions.assert_called_once()

    def test_get_cloudwatch_alarms_region(self, patched_resource, patched_client):
        """
        Test the get_cloudwatch_alarms_region function
        """
        import app
        app.get_cloudwatch_alarms_region("us-east-1")
        app.boto3.client.assert_called_once()
        app.boto3.client.return_value.describe_alarms.assert_called_once_with(AlarmTypes=['CompositeAlarm', 'MetricAlarm'])

    def test_incoming_cloudwatch_alarm(self, patched_resource, patched_client):
        """
        Test the incoming_cloudwatch_alarm function
        """
        import app
        app.incoming_cloudwatch_alarm(MagicMock(), MagicMock())
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')

    def test_subscribe_resource_to_alarm(self, patched_resource, patched_client):
        """
        Test the subscribe_resource_to_alarm function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.subscribe_resource_to_alarm("alarm_name", "us-east-1")
            app.boto3.resource.assert_called_once()
            app.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')

    def test_unsubscribe_resource_from_alarm(self, patched_resource, patched_client):
        """
        Test the unsubscribe_resource_from_alarm function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.unsubscribe_resource_from_alarm("alarm_name", "us-east-1")
            app.boto3.resource.assert_called_once()
            app.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')

    def test_subscribers_to_alarm(self, patched_resource, patched_client):
        """
        Test the subscribers_to_alarm function
        """
        import app
        app.subscribers_to_alarm("alarm_name", "us-east-1")
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_subscribed_with_state(self, patched_resource, patched_client):
        """
        Test the subscribed_with_state function
        """
        import app
        app.subscribed_with_state("1")
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_alarms_for_subscriber(self, patched_resource, patched_client):
        """
        Test the alarms_for_subscriber function
        """
        import app
        app.alarms_for_subscriber("arn")

    def test_all_subscribed_alarms(self, patched_resource, patched_client):
        """
        Test the all_subscribed_alarms function
        """
        import app
        app.all_subscribed_alarms()
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        app.boto3.resource.return_value.Table.return_value.scan.assert_called_once_with(ProjectionExpression="RegionAlarmName")

    def test_delete_alarm_subscriptions(self, patched_resource, patched_client):
        """
        Test the delete_alarm_subscriptions function
        """
        import app
        app.delete_alarm_subscriptions()
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('alarms_table')
        app.boto3.resource.return_value.Table.return_value.scan.assert_called_once_with(ProjectionExpression="RegionAlarmName,ResourceArn")

    def test_get_cloudwatch_events_state(self, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_state function
        """
        import app
        app.get_cloudwatch_events_state("set")
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('events_table')
        app.boto3.resource.return_value.Table.return_value.query.assert_called_once()
        app.boto3.resource.return_value.Table.return_value.query.return_value.get.assert_called_once_with('Items', [])

    def test_get_cloudwatch_events_state_source(self, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_state_source function
        """
        import app
        app.get_cloudwatch_events_state_source("set", "source")
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('events_table')
        app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_get_cloudwatch_events_resource_arn(self, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_resource_arn function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.get_cloudwatch_events_resource_arn("arn")
            app.boto3.resource.assert_called_once()
            app.boto3.resource.return_value.Table.assert_called_once_with('cw_table')
            app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_get_cloudwatch_events_resource_arn_start(self, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_resource_arn_start function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.get_cloudwatch_events_resource_arn_start("arn", 0)
            app.boto3.resource.assert_called_once()
            app.boto3.resource.return_value.Table.assert_called_once_with('cw_table')
            app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_get_cloudwatch_events_resource_arn_start_end(self, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_resource_arn_start_end function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.get_cloudwatch_events_resource_arn_start_end("arn", 0, 0)
            app.boto3.resource.assert_called_once()
            app.boto3.resource.return_value.Table.assert_called_once_with('cw_table')
            app.boto3.resource.return_value.Table.return_value.query.assert_called_once()

    def test_ping(self, patched_resource, patched_client):
        """
        Test the ping function
        """
        import app
        response = app.ping()
        self.assertEqual(response, {
            "message": "pong",
            "buildstamp": '1234567890',
            "version": 'v1.0.0'
        })

    def test_update_nodes(self, patched_resource, patched_client):
        """
        Test the update_nodes function
        """
        import app
        app.update_nodes(MagicMock(), MagicMock())
        app.DYNAMO_RESOURCE.Table.assert_any_call('settings_table')
        app.DYNAMO_RESOURCE.Table.return_value.get_item.assert_any_call(Key={'id': 'inventory-regions'})
        app.DYNAMO_RESOURCE.Table.return_value.get_item.assert_any_call(Key={'id': 'cache-next-region'})

    def test_update_connections(self, patched_resource, patched_client):
        """
        Test the update_connections function
        """
        import app
        app.update_connections(MagicMock(), MagicMock())
        self.assertEqual(app.boto3.resource.call_count, 68)

    def test_update_from_tags(self, patched_resource, patched_client):
        """
        Test the update_from_tags function
        """
        import app
        app.update_from_tags(MagicMock(), MagicMock())
        self.assertEqual(app.boto3.resource.call_count, 2)
        self.assertEqual(app.boto3.resource.return_value.Table.call_count, 2)

    def test_ssm_run_command(self, patched_resource, patched_client):
        """
        Test the ssm_run_command function
        """
        import app
        app.ssm_run_command(MagicMock(), MagicMock())
        app.boto3.resource.assert_called_once()
        app.boto3.resource.return_value.Table.assert_called_once_with('content_table')
        app.boto3.resource.return_value.Table.return_value.query.assert_called_once()
        app.boto3.client.assert_called_once()
        app.boto3.client.return_value.list_documents.assert_called_once_with(Filters=[{'Key': 'tag:MSAM-NodeType', 'Values': ['ElementalLive']}, {'Key': 'Owner', 'Values': ['Self']}])

    def test_process_ssm_run_command(self, patched_resource, patched_client):
        """
        Test the process_ssm_run_command function
        """
        import app
        app.process_ssm_run_command(MagicMock(), MagicMock())
        self.assertEqual(app.boto3.client.call_count, 2)
        app.boto3.client.return_value.get_log_events.assert_called_once()
        app.boto3.client.return_value.put_metric_data.assert_called_once()

    def test_update_ssm_nodes(self, patched_resource, patched_client):
        """
        Test the update_ssm_nodes function
        """
        import app
        app.update_ssm_nodes(MagicMock(), MagicMock())
        app.DYNAMO_RESOURCE.Table.assert_any_call('settings_table')
        app.DYNAMO_RESOURCE.Table.return_value.get_item.assert_any_call(Key={'id': 'inventory-regions'})
        app.DYNAMO_RESOURCE.Table.return_value.get_item.assert_any_call(Key={'id': 'ssm-cache-next-region'})

    def test_generate_metrics(self, patched_resource, patched_client):
        """
        Test the generate_metrics function
        """
        import app
        app.generate_metrics(MagicMock(), MagicMock())
        app.boto3.client.assert_called_once()
        self.assertEqual(app.boto3.client.return_value.put_metric_data.call_count, 14)

    def test_get_resource_notes(self, patched_resource, patched_client):
        """
        Test the get_resource_notes function
        """
        import app
        app.get_resource_notes("arn")
        app.DYNAMO_RESOURCE.Table.return_value.query.assert_called_once()

    def test_all_notes(self, patched_resource, patched_client):
        """
        Test the all_notes function
        """
        import app
        app.all_notes()
        app.DYNAMO_RESOURCE.Table.return_value.scan.assert_called_once()
        app.DYNAMO_RESOURCE.Table.return_value.scan.return_value.get.assert_called_once_with('Items', [])

    def test_update_resource_notes(self, patched_resource, patched_client):
        """
        Test the update_resource_notes function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.update_resource_notes("arn")
            app.DYNAMO_RESOURCE.Table.return_value.put_item.assert_called_once()

    def test_delete_resource_notes(self, patched_resource, patched_client):
        """
        Test the delete_resource_notes function
        """
        import app
        app.delete_resource_notes("arn")
        app.DYNAMO_RESOURCE.Table.return_value.delete_item.assert_called_once_with(Key={'resource_arn': 'arn'})

    def test_delete_all_notes(self, patched_resource, patched_client):
        """
        Test the delete_all_notes function
        """
        import app
        app.delete_all_notes()

    def test_delete_all_resource_notes(self, patched_resource, patched_client):
        """
        Test the delete_all_resource_notes function
        """
        import app
        app.delete_all_resource_notes(MagicMock(), MagicMock())
        app.DYNAMO_RESOURCE.Table.return_value.scan.assert_called_once_with(ProjectionExpression='resource_arn')
