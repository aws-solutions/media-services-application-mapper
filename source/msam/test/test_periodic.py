"""
This module is provides unit tests for the periodic.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch, MagicMock

@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestPeriodic(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_update_alarms(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_alarms function
        """
        from chalicelib import periodic
        periodic.update_alarms()

    def test_update_connections(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_connections function
        """
        from chalicelib import periodic
        periodic.update_connections()

    def test_update_nodes(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_nodes function
        """
        from chalicelib import periodic
        periodic.update_nodes()

    def test_update_ssm_nodes(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_ssm_nodes function
        """
        from chalicelib import periodic
        periodic.update_ssm_nodes()

    def test_update_nodes_generic(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_nodes_generic function
        """
        from chalicelib import periodic
        periodic.update_nodes_generic("function1", "function2", "some_key")

    def test_update_from_tags(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the update_from_tags function
        """
        from chalicelib import periodic
        periodic.update_from_tags()

    def test_ssm_run_command(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the ssm_run_command function
        """
        from chalicelib import periodic
        periodic.ssm_run_command()

    def test_process_ssm_run_command(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the process_ssm_run_command function
        """
        from chalicelib import periodic
        periodic.process_ssm_run_command(MagicMock())

    def test_generate_metrics(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the generate_metrics function
        """
        from chalicelib import periodic
        periodic.generate_metrics("stack_name")

    def test_report_metrics(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the report_metrics function
        """
        from chalicelib import periodic
        from chalicelib import settings
        with patch.object(settings, 'get_setting', return_value="invalid-uuid"):
            periodic.report_metrics("stack_name", 1)


        
