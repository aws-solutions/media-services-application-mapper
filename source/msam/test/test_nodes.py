"""
This module provides unit tests for the nodes.py module.
"""

# pylint: disable=C0415,W0201,R0904

import unittest
import boto3
from unittest.mock import patch
from botocore.exceptions import ClientError

ARN = 'THIS-IS-NOT-AN-ARN'
CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "ClientError")
REGION = 'us-east-1'

@patch('boto3.client')
@patch('boto3.resource')
@patch('os.environ')
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
        with patch.object(content, 'put_ddb_items', side_effect=CLIENT_ERROR):
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
            items = nodes.s3_bucket_ddb_items()
            self.assertEqual(len(items), 1)


    def test_cloudfront_distribution_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the s3_bucket_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'cloudfront_distributions', return_value=[{"ARN": "some-arn"}]):
            items = nodes.cloudfront_distribution_ddb_items()
            self.assertEqual(len(items), 1)

    def test_medialive_channel_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_channel_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'medialive_channels', return_value=[{"Arn": "some-arn"}]):
            items = nodes.medialive_channel_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_medialive_input_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_input_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'medialive_inputs', return_value=[{"Arn": "some-arn"}]):
            items = nodes.medialive_input_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_medialive_multiplex_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_multiplex_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'medialive_multiplexes', return_value=[{"Arn": "some-arn"}]):
            items = nodes.medialive_multiplex_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_mediapackage_channel_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediapackage_channel_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediapackage_channels', return_value=[{"Arn": "some-arn"}]):
            items = nodes.mediapackage_channel_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_mediapackage_origin_endpoint_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediapackage_origin_endpoint_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediapackage_origin_endpoints', return_value=[{"Arn": "some-arn"}]):
            items = nodes.mediapackage_origin_endpoint_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_mediastore_container_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediastore_container_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediastore_containers', return_value=[{"ARN": "some-arn"}]):
            items = nodes.mediastore_container_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_mediaconnect_flow_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediaconnect_flow_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediaconnect_flows', return_value=[{"FlowArn": "some-arn"}]):
            items = nodes.mediaconnect_flow_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)


    def test_mediatailor_configuration_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediatailor_configuration_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'mediatailor_configurations', return_value=[{"PlaybackConfigurationArn": "some-arn"}]):
            items = nodes.mediatailor_configuration_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_ssm_managed_instance_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the ssm_managed_instance_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'ssm_managed_instances', return_value=[{"Id": "some-arn"}]):
            items = nodes.ssm_managed_instance_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_ec2_instance_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the ec2_instance_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'ec2_instances', return_value=[{"InstanceId": "some-arn"}]):
            items = nodes.ec2_instance_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_link_device_ddb_items(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the link_device_ddb_items function
        """
        from chalicelib import nodes
        with patch.object(nodes, 'link_devices', return_value=[{"Arn": "some-arn"}]):
            items = nodes.link_device_ddb_items("us-east-1")
            self.assertEqual(len(items), 1)

    def test_node_to_ddb_item(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the node_to_ddb_item function
        """
        from chalicelib import nodes
        item = nodes.node_to_ddb_item("this-arn", "medialive", "us-east-1", {"data": "value"})
        self.assertEqual(item['arn'], 'this-arn')
        self.assertEqual(item['region'], 'us-east-1')
        self.assertEqual(item['service'], 'medialive')
        self.assertEqual(item['data'], '{"data": "value"}')

    def test_cloudfront_distributions(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the cloudfront_distributions function
        """
        from chalicelib import nodes
        patched_client.return_value.list_distributions.return_value = {"DistributionList": {"Items": [{"ARN": ARN, "LastModifiedTime": "time"}]}}
        patched_client.return_value.list_tags_for_resource.return_value = {'Tags': {'Items': [{'Key': 'string', 'Value': 'string'}]}}
        items = nodes.cloudfront_distributions()
        self.assertEqual(len(items), 1)

        patched_client.return_value.list_tags_for_resource.side_effect = CLIENT_ERROR
        items = nodes.cloudfront_distributions()
        self.assertEqual(len(items), 1)

    def test_s3_buckets(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the s3_buckets function
        """
        from chalicelib import nodes
        patched_client.return_value.list_buckets.return_value = {"Buckets": [{"Name": "BucketName", "CreationDate": "time"}]}
        patched_client.return_value.get_bucket_tagging.return_value = {'TagSet': [{'Key': 'string', 'Value': 'string'}]}
        buckets = nodes.s3_buckets()
        self.assertEqual(len(buckets), 1)

        patched_client.return_value.get_bucket_tagging.side_effect = CLIENT_ERROR
        buckets = nodes.s3_buckets()
        self.assertEqual(len(buckets), 1)

    def test_mediapackage_channels(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediapackage_channels function
        """
        from chalicelib import nodes

        patched_client.return_value.list_channels.side_effect =[{"Channels": ["channelA"], "NextToken": "token"},
                {"Channels": ["channelA"]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.mediapackage_channels(REGION)
            self.assertEqual(len(items), 2)

    def test_mediapackage_origin_endpoints(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediapackage_origin_endpoints function
        """
        from chalicelib import nodes

        patched_client.return_value.list_origin_endpoints.side_effect = [{"OriginEndpoints": ["channelA"], "NextToken": "token"},
        {"OriginEndpoints": ["channelA"]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.mediapackage_origin_endpoints(REGION)
            self.assertEqual(len(items), 2)

    def test_medialive_channels(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_channels function
        """
        from chalicelib import nodes

        patched_client.return_value.list_channels.side_effect = [{"Channels": ["channelA"], "NextToken": "token"},
            {"Channels": ["channelA"]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.medialive_channels(REGION)
            self.assertEqual(len(items), 2)

    def test_medialive_inputs(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_inputs function
        """
        from chalicelib import nodes

        patched_client.return_value.list_inputs.side_effect = [{"Inputs": ["channelA"], "NextToken": "token"},
            {"Inputs": ["channelA"]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.medialive_inputs(REGION)
            self.assertEqual(len(items), 2)

    def test_medialive_multiplexes(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the medialive_multiplexes function
        """
        from chalicelib import nodes

        patched_client.return_value.list_multiplexes.side_effect = [{"Multiplexes": [{"Id": "channelA"}], "NextToken": "token"},
            {"Multiplexes": [{"Id": "channelA"}]}]
        patched_client.return_value.describe_multiplex.side_effect = [{"ResponseMetadata":"data"}, {"ResponseMetadata":"data"}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.medialive_multiplexes(REGION)
            self.assertEqual(len(items), 2)

    def test_mediastore_containers(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediastore_containers function
        """
        from chalicelib import nodes

        patched_client.return_value.list_containers.side_effect = [{"Containers": [{"ARN": ARN, "CreationTime": "time"}], "NextToken": "token"},
            {"Containers": [{"ARN": ARN , "CreationTime": "time"}]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.mediastore_containers(REGION)
            self.assertEqual(len(items), 2)

    def test_mediaconnect_flows(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediaconnect_flows function
        """
        from chalicelib import nodes

        patched_client.return_value.list_flows.side_effect =  [{"Flows": [{"FlowArn": ARN}], "NextToken": "token"},
            {"Flows": [{"FlowArn": ARN}]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.mediaconnect_flows(REGION)
            self.assertEqual(len(items), 2)

    def test_mediatailor_configurations(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the mediatailor_configurations function
        """
        from chalicelib import nodes

        patched_client.return_value.list_playback_configurations.side_effect =  [{"Items": [{"Name": ARN}], "NextToken": "token"},
            {"Items": [{"Name": ARN}]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.mediatailor_configurations(REGION)
            self.assertEqual(len(items), 2)

    def test_ssm_managed_instances(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the ssm_managed_instances function
        """
        from chalicelib import nodes

        patched_client.return_value.get_inventory.side_effect =  [{"Entities": [{"Id": "mi-instance"}], "NextToken": "token"},
            {"Entities": [{"Id": "mi-instance"}]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.ssm_managed_instances(REGION)
            self.assertEqual(len(items), 2)

    def test_ec2_instances(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the ec2_instances function
        """
        from chalicelib import nodes

        patched_client.return_value.describe_instances.side_effect = [{
            "Reservations": [{
                "Instances": [{
                    "Tags": [{
                        'Key': 'string',
                        'Value': 'string'
                    }]
                }]
            }],
            "NextToken":
            "token"
        }, {
            "Reservations": [{
                "Instances": [{
                    "Tags": [{
                        'Key': 'string',
                        'Value': 'string'
                    }]
                }]
            }]
        }]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.ec2_instances(REGION)
            self.assertEqual(len(items), 2)

    def test_link_devices(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the link_devices function
        """
        from chalicelib import nodes

        patched_client.return_value.list_input_devices.side_effect =  [{"InputDevices": [{"Id": "mi-instance"}], "NextToken": "token"},
            {"InputDevices": [{"Id": "mi-instance"}]}]
        with patch.object(boto3.Session, 'get_available_regions', return_value = [REGION]):
            items = nodes.link_devices(REGION)
            self.assertEqual(len(items), 2)
