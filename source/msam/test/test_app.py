"""
This module is provides unit tests for the app.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch, MagicMock

@patch('boto3.client')
@patch('boto3.resource')
@patch('os.environ')
class TestApp(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_get_view_layout(self, patched_env, patched_resource, patched_client):
        """
        Test the get_view_layout function
        """
        import app
        app.get_view_layout("any_view")

    def test_delete_view_layout(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_view_layout function
        """
        import app
        app.delete_view_layout("any_view", "node_id")

    def test_set_view_layout(self, patched_env, patched_resource, patched_client):
        """
        Test the set_view_layout function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.set_view_layout()

    def test_delete_layout_views(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_layout_views function
        """
        import app
        app.delete_layout_views()

    def test_get_channel_list(self, patched_env, patched_resource, patched_client):
        """
        Test the get_channel_list function
        """
        import app
        app.get_channel_list()

    def test_delete_all_channels(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_all_channels function
        """
        import app
        app.delete_all_channels()

    def test_set_channel_nodes(self, patched_env, patched_resource, patched_client):
        """
        Test the set_channel_nodes function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.set_channel_nodes("channel_name")

    def test_get_channel_nodes(self, patched_env, patched_resource, patched_client):
        """
        Test the get_channel_nodes function
        """
        import app
        app.get_channel_nodes("channel_name")

    def test_delete_channel_nodes(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_channel_nodes function
        """
        import app
        app.delete_channel_nodes("channel_name")

    def test_application_settings(self, patched_env, patched_resource, patched_client):
        """
        Test the application_settings function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.application_settings("channel_name")

    def test_cached_by_service_region(self, patched_env, patched_resource, patched_client):
        """
        Test the cached_by_service_region function
        """
        import app
        app.cached_by_service_region("service", "us-east-1")

    def test_cached_by_service(self, patched_env, patched_resource, patched_client):
        """
        Test the cached_by_service function
        """
        import app
        app.cached_by_service("service")

    def test_cached_by_arn(self, patched_env, patched_resource, patched_client):
        """
        Test the cached_by_arn function
        """
        import app
        app.cached_by_arn("service")

    def test_put_cached_data(self, patched_env, patched_resource, patched_client):
        """
        Test the put_cached_data function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.put_cached_data()

    def test_delete_cached_data(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_cached_data function
        """
        import app
        app.delete_cached_data("service")

    def test_regions(self, patched_env, patched_resource, patched_client):
        """
        Test the regions function
        """
        import app
        app.regions()

    def test_get_cloudwatch_alarms_region(self, patched_env, patched_resource, patched_client):
        """
        Test the get_cloudwatch_alarms_region function
        """
        import app
        app.get_cloudwatch_alarms_region("us-east-1")

    def test_incoming_cloudwatch_alarm(self, patched_env, patched_resource, patched_client):
        """
        Test the incoming_cloudwatch_alarm function
        """
        import app
        app.incoming_cloudwatch_alarm(MagicMock(), MagicMock())

    def test_subscribe_resource_to_alarm(self, patched_env, patched_resource, patched_client):
        """
        Test the subscribe_resource_to_alarm function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.subscribe_resource_to_alarm("alarm_name", "us-east-1")

    def test_unsubscribe_resource_from_alarm(self, patched_env, patched_resource, patched_client):
        """
        Test the unsubscribe_resource_from_alarm function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.unsubscribe_resource_from_alarm("alarm_name", "us-east-1")

    def test_subscribers_to_alarm(self, patched_env, patched_resource, patched_client):
        """
        Test the get_cloudwatch_alarms_region function
        """
        import app
        app.subscribers_to_alarm("alarm_name", "us-east-1")

    def test_subscribed_with_state(self, patched_env, patched_resource, patched_client):
        """
        Test the subscribed_with_state function
        """
        import app
        app.subscribed_with_state("1")

    def test_alarms_for_subscriber(self, patched_env, patched_resource, patched_client):
        """
        Test the alarms_for_subscriber function
        """
        import app
        app.alarms_for_subscriber("arn")

    def test_all_subscribed_alarms(self, patched_env, patched_resource, patched_client):
        """
        Test the all_subscribed_alarms function
        """
        import app
        app.all_subscribed_alarms()

    def test_delete_alarm_subscriptions(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_alarm_subscriptions function
        """
        import app
        app.delete_alarm_subscriptions()

    def test_get_cloudwatch_events_state(self, patched_env, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_state function
        """
        import app
        app.get_cloudwatch_events_state("set")

    def test_get_cloudwatch_events_state_source(self, patched_env, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_state_source function
        """
        import app
        app.get_cloudwatch_events_state_source("set", "source")

    # def test_get_cloudwatch_events_state_groups(self, patched_env, patched_resource, patched_client):
    #     """
    #     Test the get_cloudwatch_events_state_groups function
    #     """
    #     import app
    #     app.get_cloudwatch_events_state_groups("set")

    def test_get_cloudwatch_events_resource_arn(self, patched_env, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_resource_arn function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.get_cloudwatch_events_resource_arn("arn")

    def test_get_cloudwatch_events_resource_arn_start(self, patched_env, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_resource_arn_start function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.get_cloudwatch_events_resource_arn_start("arn", 0)

    def test_get_cloudwatch_events_resource_arn_start_end(self, patched_env, patched_resource, patched_client):
        """
        Test the get_cloudwatch_events_resource_arn_start_end function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.get_cloudwatch_events_resource_arn_start_end("arn", 0, 0)

    def test_ping(self, patched_env, patched_resource, patched_client):
        """
        Test the ping function
        """
        import app
        app.ping()

    def test_update_nodes(self, patched_env, patched_resource, patched_client):
        """
        Test the update_nodes function
        """
        import app
        app.update_nodes(MagicMock(), MagicMock())

    def test_update_connections(self, patched_env, patched_resource, patched_client):
        """
        Test the update_connections function
        """
        import app
        app.update_connections(MagicMock(), MagicMock())

    def test_update_from_tags(self, patched_env, patched_resource, patched_client):
        """
        Test the update_from_tags function
        """
        import app
        app.update_from_tags(MagicMock(), MagicMock())

    def test_ssm_run_command(self, patched_env, patched_resource, patched_client):
        """
        Test the ssm_run_command function
        """
        import app
        app.ssm_run_command(MagicMock(), MagicMock())

    def test_process_ssm_run_command(self, patched_env, patched_resource, patched_client):
        """
        Test the process_ssm_run_command function
        """
        import app
        app.process_ssm_run_command(MagicMock(), MagicMock())

    def test_update_ssm_nodes(self, patched_env, patched_resource, patched_client):
        """
        Test the update_ssm_nodes function
        """
        import app
        app.update_ssm_nodes(MagicMock(), MagicMock())

    def test_generate_metrics(self, patched_env, patched_resource, patched_client):
        """
        Test the generate_metrics function
        """
        import app
        app.generate_metrics(MagicMock(), MagicMock())

    # def test_report_metrics(self, patched_env, patched_resource, patched_client):
    #     """
    #     Test the report_metrics function
    #     """
    #     import app
    #     app.report_metrics(MagicMock(), MagicMock())

    def test_get_resource_notes(self, patched_env, patched_resource, patched_client):
        """
        Test the get_resource_notes function
        """
        import app
        app.get_resource_notes("arn")

    def test_all_notes(self, patched_env, patched_resource, patched_client):
        """
        Test the all_notes function
        """
        import app
        app.all_notes()

    def test_update_resource_notes(self, patched_env, patched_resource, patched_client):
        """
        Test the update_resource_notes function
        """
        import app
        with patch.object(app, 'app', return_value={}):
            app.update_resource_notes("arn")

    def test_delete_resource_notes(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_resource_notes function
        """
        import app
        app.delete_resource_notes("arn")

    def test_delete_all_notes(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_all_notes function
        """
        import app
        app.delete_all_notes()

    def test_delete_all_resource_notes(self, patched_env, patched_resource, patched_client):
        """
        Test the delete_all_resource_notes function
        """
        import app
        app.delete_all_resource_notes(MagicMock(), MagicMock())
