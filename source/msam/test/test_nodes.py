"""
This module provides unit tests for the nodes.py module.
"""

# pylint: disable=C0415,W0201

import unittest
from unittest.mock import patch
from botocore.exceptions import ClientError


@patch('os.environ')
@patch('boto3.resource')
@patch('boto3.client')
class TestNodes(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_update_regional_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the update_regional_ddb_items function
        """
        from chalicelib import nodes
        from chalicelib import content
        nodes.update_regional_ddb_items("us-east-1")
        with patch.object(content, 'put_ddb_items',  
                            side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "update_regional_ddb_items")):
            nodes.update_regional_ddb_items("us-east-1")
            self.assertRaises(ClientError)

    def test_update_regional_ssm_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the update_regional_ssm_ddb_items function
        """
        from chalicelib import nodes
        from chalicelib import content
        nodes.update_regional_ssm_ddb_items("us-east-1")
        # test exception
        with patch.object(content, 'put_ddb_items',  
                            side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "update_regional_ssm_ddb_items")):
            nodes.update_regional_ssm_ddb_items("us-east-1")
            self.assertRaises(ClientError)

    def test_update_global_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the update_global_ddb_items function
        """
        from chalicelib import nodes
        from chalicelib import content
        nodes.update_global_ddb_items()
        # test exception
        with patch.object(content, 'put_ddb_items',  
                            side_effect=ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "update_global_ddb_items")):
            nodes.update_global_ddb_items()
            self.assertRaises(ClientError)

    def test_s3_bucket_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the s3_bucket_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 's3_buckets', return_value=[{"Name": "mybucket"}]):
            nodes.s3_bucket_ddb_items()


    def test_cloudfront_distribution_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the s3_bucket_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'cloudfront_distributions', return_value=[{"ARN": "some-arn"}]):
            nodes.cloudfront_distribution_ddb_items()

    def test_medialive_channel_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_channel_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'medialive_channels', return_value=[{"Arn": "some-arn"}]):
            nodes.medialive_channel_ddb_items("us-east-1")

    def test_medialive_input_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_input_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'medialive_inputs', return_value=[{"Arn": "some-arn"}]):
            nodes.medialive_input_ddb_items("us-east-1")

    def test_medialive_multiplex_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_multiplex_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'medialive_multiplexes', return_value=[{"Arn": "some-arn"}]):
            nodes.medialive_multiplex_ddb_items("us-east-1")

    def test_mediapackage_channel_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediapackage_channel_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediapackage_channels', return_value=[{"Arn": "some-arn"}]):
            nodes.mediapackage_channel_ddb_items("us-east-1")

    def test_mediapackage_origin_endpoint_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediapackage_origin_endpoint_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediapackage_origin_endpoints', return_value=[{"Arn": "some-arn"}]):
            nodes.mediapackage_origin_endpoint_ddb_items("us-east-1")

    def test_mediastore_container_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediastore_container_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediastore_containers', return_value=[{"ARN": "some-arn"}]):
            nodes.mediastore_container_ddb_items("us-east-1")

    def test_mediaconnect_flow_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediaconnect_flow_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediaconnect_flows', return_value=[{"FlowArn": "some-arn"}]):
            nodes.mediaconnect_flow_ddb_items("us-east-1")


    def test_mediatailor_configuration_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediatailor_configuration_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediatailor_configurations', return_value=[{"PlaybackConfigurationArn": "some-arn"}]):
            nodes.mediatailor_configuration_ddb_items("us-east-1")

    def test_ssm_managed_instance_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the ssm_managed_instance_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'ssm_managed_instances', return_value=[{"Id": "some-arn"}]):
            nodes.ssm_managed_instance_ddb_items("us-east-1")

    def test_ec2_instance_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the ec2_instance_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'ec2_instances', return_value=[{"InstanceId": "some-arn"}]):
            nodes.ec2_instance_ddb_items("us-east-1")

    def test_link_device_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the link_device_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'link_devices', return_value=[{"Arn": "some-arn"}]):
            nodes.link_device_ddb_items("us-east-1")

    def test_node_to_ddb_item(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the node_to_ddb_item function
        """
        from chalicelib import nodes
        nodes.node_to_ddb_item("this-arn", "medialive", "us-east-1", {"data": "value"})

