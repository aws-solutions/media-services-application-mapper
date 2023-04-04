"""
This module is provides unit tests for the media_events.py module.
"""

# pylint: disable=C0415,W0201

import os
import unittest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

ARN = "arn:msam:user-defined-node:global:111122223333:10AA8D40-2B6F-44FA-AA67-6B909F8B1DB9"
CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "ClientError")

os.environ["SOLUTION_ID"] = "SO0166"
os.environ["EVENTS_TABLE_REGION"] = "us-east-1"
os.environ["EVENTS_TABLE_NAME"] = "events_table"
os.environ["CLOUDWATCH_EVENTS_TABLE_NAME"] = "cw_table"
os.environ["CONTENT_TABLE_NAME"] = "content_table"
os.environ["ITEM_TTL"] = "600"

@patch('boto3.client')
@patch('boto3.resource')
class TestMediaEvents(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """
    def test_lambda_handler(self, patched_resource,
                                     patched_client):
        """
        Test the lambda_handler function
        """
        import media_events
        mocked_events = [{"time": "2022-07-19T17:04:40Z", "resources": [], 
            "detail": {"alarm_id": "id", "alarm_state": "ALARM", "eventName": "MediaLive Alarm",
            "requestParameters": {"channelId": "9276485"}},
            "region": "us-west-2", "account": "1234567890",  
            "source": "aws.medialive", "detail-type": "MediaLive Alert BatchUpdateSchedule", 
            "channel_arn": "arn:aws:medialive:us-west-2:1234567890:channel:9276485"},
            {"time": "2022-07-19T17:04:40Z", "resources": [], "detail": {"error-id": "id", "errored": "ALARM",
            "error-code": "code", "error-message": "message"},  
            "source": "aws.mediaconnect", "detail-type": "MediaConnect Alert", 
            "channel_arn": "arn:aws:medialive:us-west-2:1234567890:channel:9276485"},
            {"time": "2022-07-19T17:04:40Z", "resources": [], "detail": {"error-id": "id", "errored": "ALARM",
            "error-code": "code", "error-message": "message"},
            "source": "aws.mediapackage", "detail-type": "MediaPackage Alert HarvestJob", 
            "channel_arn": "arn:aws:medialive:us-west-2:1234567890:channel:9276485"},
            {"time": "2022-07-19T17:04:40Z", "resources": [], "detail": {"error-id": "id", "errored": "ALARM",
            "error-code": "code", "error-message": "message"},
            "source": "aws.mediastore", "detail-type": "MediaStore Object State Change", 
            "resource_arn": "arn:aws:mediastore:us-west-2:1234567890:container/mytestcontainer"}]
        mocked_event = {"time": "2022-07-19T17:04:40Z", "resources": [], "detail": {},  
            "source": "aws.cloudwatch", "detail-type": "CloudWatch Alarm State Change"}
        patched_client.return_value.describe_origin_endpoint.return_value = {"Arn": ARN}
        with patch.object(media_events.EVENTS_TABLE, 'put_item', return_value={}):
            with patch.object(media_events.CLOUDWATCH_EVENTS_TABLE, 'put_item', return_value={}):
                for event in mocked_events:
                    result = media_events.lambda_handler(event, MagicMock())
                    self.assertTrue(result)
        
        patched_client.return_value.describe_origin_endpoint.side_effect = CLIENT_ERROR
        media_events.lambda_handler(mocked_event, MagicMock())
        self.assertRaises(ClientError)
