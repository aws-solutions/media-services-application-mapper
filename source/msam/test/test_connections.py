"""
This module is provides unit tests for the connections.py module.
"""

# pylint: disable=C0415,W0201,R0904

import unittest
from unittest.mock import patch
from botocore.exceptions import ClientError

CLIENT_ERROR = ClientError({"Error": {"Code": "400", "Message": "SomeClientError"}}, "MockedFunction")
CACHED_ML_INPUTS = [{"data": "{\"Arn\": \"arn:aws:medialive:us-west-2:1234567890:input:1183363\", \
    \"AttachedChannels\": [\"874994\"], \"Destinations\": [{\"Ip\": \"172.31.37.145\", \"Port\": \"5000\", \
    \"Url\": \"172.31.37.145:5000\", \"Vpc\": {\"AvailabilityZone\": \"us-west-2a\", \"NetworkInterfaceId\": \"eni-0dbfc87cc25409406\"}}, \
    {\"Ip\": \"172.31.27.48\", \"Port\": \"5000\", \"Url\": \"172.31.27.48:5000\", \"Vpc\": {\"AvailabilityZone\": \"us-west-2b\", \
    \"NetworkInterfaceId\": \"eni-0735a434f5a6924ca\"}}], \"Id\": \"1183363\", \"InputClass\": \"STANDARD\", \"InputDevices\": [], \
    \"InputPartnerIds\": [\"7749690\"], \"InputSourceType\": \"STATIC\", \"MediaConnectFlows\": [], \"Name\": \"cdi-input\", \
    \"RoleArn\": \"arn:aws:iam::1234567890:role/MediaLiveAccessRole\", \"SecurityGroups\": [], \"Sources\": \
    [{\"Url\":\"mediastoressl://oszgjooyyimoxd.data.mediastore.us-west-2.amazonaws.com\"}], \
    \"State\": \"ATTACHED\", \"Tags\": {}, \"Type\": \"AWS_CDI\"}"}]
CACHED_MS_CONTAINERS = [{"data": "{\"Endpoint\": \"https://oszgjooyyimoxd.data.mediastore.us-west-2.amazonaws.com\", \
    \"CreationTime\": \"2021-12-09 21:17:34+00:00\", \"ARN\": \"arn:aws:mediastore:us-west-2:1234567890:container/mytestcontainer\", \
    \"Name\": \"mytestcontainer\", \"Status\": \"ACTIVE\", \"AccessLoggingEnabled\": false, \"Tags\": [{\"Key\": \"msam-tag\", \"Value\": \"somevalue\"}]}"}]
CACHED_ML_CHANNELS = [{"data": "{\"Arn\": \"arn:aws:medialive:us-west-2:1234567890:channel:7678336\", \"ChannelClass\": \"SINGLE_PIPELINE\", \
    \"Destinations\": [{\"Id\": \"mediapackage-destination\", \"MediaPackageSettings\": [{\"ChannelId\": \"MyLiveStreaming\"}], \
    \"Settings\": [{\"Url\":\"mediastoressl://oszgjooyyimoxd.data.mediastore.us-west-2.amazonaws.com\"}, {\"Url\": \"rtp://3.224.227.140:5000\"}, {\"Url\": \"rtp://23.21.12.216:5001\"}], \
    \"MultiplexSettings\": {\"MultiplexId\": \"2911217\", \"ProgramName\": \"ProgramName\"}}], \"EgressEndpoints\": [{\"SourceIp\": \"52.37.63.182\"}], \"Id\": \"7678336\", \"InputAttachments\": \
    [{\"InputAttachmentName\": \"MyLiveStreaming\", \"InputId\": \"4627337\", \"InputSettings\": {\"AudioSelectors\": [], \
    \"CaptionSelectors\": [], \"DeblockFilter\": \"DISABLED\", \"DenoiseFilter\": \"DISABLED\", \"FilterStrength\": 1, \
    \"InputFilter\": \"AUTO\", \"Smpte2038DataPreference\": \"IGNORE\", \"SourceEndBehavior\": \"LOOP\"}}], \
    \"InputSpecification\": {\"Codec\": \"AVC\", \"MaximumBitrate\": \"MAX_20_MBPS\", \"Resolution\": \"HD\"}, \
    \"Name\": \"MyLiveStreaming\", \"PipelinesRunningCount\": 0, \"RoleArn\": \"arn:aws:iam::1234567890:role/MediaLiveAccessRole\", \
    \"State\": \"IDLE\", \"Tags\": {\"MediaLive-Workflow\": \"MyLiveStreaming\", \"MSAM-Diagram\": \"MyLiveStreaming\", \
    \"MSAM-Tile\": \"MyLiveStreaming\"}}"}]
CACHED_ML_CHANNELS_2 = [{"data": "{\"Arn\": \"arn:aws:medialive:us-west-2:1234567890:channel:7678336\", \"ChannelClass\": \"SINGLE_PIPELINE\", \
    \"Destinations\": [{\"Id\": \"mediapackage-destination\", \"MediaPackageSettings\": [], \
    \"Settings\": [{\"Url\":\"mediastoressl://oszgjooyyimoxd.data.mediastore.us-west-2.amazonaws.com\"}, {\"Url\": \"rtp://3.224.227.140:5000\"}, {\"Url\": \"rtp://23.21.12.216:5001\"}], \
    \"MultiplexSettings\": {\"MultiplexId\": \"2911217\", \"ProgramName\": \"ProgramName\"}}], \"EgressEndpoints\": [{\"SourceIp\": \"52.37.63.182\"}], \"Id\": \"7678336\", \"InputAttachments\": \
    [{\"InputAttachmentName\": \"MyLiveStreaming\", \"InputId\": \"4627337\", \"InputSettings\": {\"AudioSelectors\": [], \
    \"CaptionSelectors\": [], \"DeblockFilter\": \"DISABLED\", \"DenoiseFilter\": \"DISABLED\", \"FilterStrength\": 1, \
    \"InputFilter\": \"AUTO\", \"Smpte2038DataPreference\": \"IGNORE\", \"SourceEndBehavior\": \"LOOP\"}}], \
    \"InputSpecification\": {\"Codec\": \"AVC\", \"MaximumBitrate\": \"MAX_20_MBPS\", \"Resolution\": \"HD\"}, \
    \"Name\": \"MyLiveStreaming\", \"PipelinesRunningCount\": 0, \"RoleArn\": \"arn:aws:iam::1234567890:role/MediaLiveAccessRole\", \
    \"State\": \"IDLE\", \"Tags\": {\"MediaLive-Workflow\": \"MyLiveStreaming\", \"MSAM-Diagram\": \"MyLiveStreaming\", \
    \"MSAM-Tile\": \"MyLiveStreaming\"}}"}]
CACHED_MULTIPLEX = [{"data": "{\"Arn\": \"arn:aws:medialive:us-east-1:1234567890:multiplex:2911217\", \"AvailabilityZones\": \
    [\"us-east-1a\", \"us-east-1b\"], \"Destinations\": [{\"MediaConnectSettings\": {\"EntitlementArn\": \
    \"arn:aws:mediaconnect:us-east-1:1234567890:entitlement:1-CAVaVVRQUAMLAF0P-43e6ff4eb1d4:Multiplex-2911217-pipeline-0\"}},\
    {\"MediaConnectSettings\": {\"EntitlementArn\": \"arn:aws:mediaconnect:us-east-1:1234567890:entitlement:1-ClMDBwIEBlNQAlNZ-07e7e40cabfb:Multiplex-2911217-pipeline-1\"}}], \
    \"Id\": \"2911217\", \"MultiplexSettings\": {\"TransportStreamBitrate\": 5000000, \"TransportStreamId\": 1001},\
    \"Name\": \"multiplex-test\", \"PipelinesRunningCount\": 0, \"ProgramCount\": 1, \"State\": \"IDLE\", \"Tags\": {}}"}]
CACHED_MP_CHANNELS = [{"arn": "arn:aws:mediapackage:us-west-2:1234567890:channels/286eb42a8bf44695a44bdb48e4fb6f3f", \
    "data": "{\"Arn\": \"arn:aws:mediapackage:us-west-2:1234567890:channels/286eb42a8bf44695a44bdb48e4fb6f3f\", \
    \"Description\": \"Channel created by MediaLive workflow - MyLiveStreaming\", \"HlsIngest\": {\"IngestEndpoints\": [{\"Id\": \"286eb42a8bf44695a44bdb48e4fb6f3f\", \
    \"Password\": \"XXXXXXXXXXXX\", \"Url\": \"https://626e3c9e793c034c.mediapackage.us-west-2.amazonaws.com/in/v2/286eb42a8bf44695a44bdb48e4fb6f3f/286eb42a8bf44695a44bdb48e4fb6f3f/channel\", \
    \"Username\": \"a22f6027e2f94e2eb2c2d7871157dfa9\"}, {\"Id\": \"536730eb847541bdac7c7c02716612cc\", \"Password\": \"XXXXXXXXXXXX\", \
    \"Url\": \"https://7e8d2bf79a4d2779.mediapackage.us-west-2.amazonaws.com/in/v2/286eb42a8bf44695a44bdb48e4fb6f3f/536730eb847541bdac7c7c02716612cc/channel\", \
    \"Username\": \"3dc7ac3b666c45d297a24e6c626151e2\"}]}, \"Id\": \"MyLiveStreaming\", \"Tags\": {\"MediaLive-Workflow\": \"MyLiveStreaming\", \
    \"MSAM-Diagram\": \"MyLiveStreaming\", \"MSAM-Tile\": \"MyLiveStreaming\"}}"}]
CACHED_MP_ENDPOINTS = [{"arn": "arn:aws:mediapackage:us-west-2:1234567890:origin_endpoints/9d9f3e3bf04c44efb7e0fc806a546fc3", \
    "data": "{\"Arn\": \"arn:aws:mediapackage:us-west-2:1234567890:origin_endpoints/9d9f3e3bf04c44efb7e0fc806a546fc3\", \
    \"ChannelId\": \"MyLiveStreaming\", \"Description\": \"HLS endpoint created by MediaLive for channel MyLiveStreaming\", \
    \"HlsPackage\": {\"AdMarkers\": \"NONE\", \"AdTriggers\": [\"SPLICE_INSERT\", \"PROVIDER_ADVERTISEMENT\", \"DISTRIBUTOR_ADVERTISEMENT\", \
    \"PROVIDER_PLACEMENT_OPPORTUNITY\", \"DISTRIBUTOR_PLACEMENT_OPPORTUNITY\"], \"AdsOnDeliveryRestrictions\": \"RESTRICTED\", \
    \"IncludeDvbSubtitles\": false, \"IncludeIframeOnlyStream\": false, \"PlaylistType\": \"EVENT\", \"PlaylistWindowSeconds\": 60, \
    \"ProgramDateTimeIntervalSeconds\": 0, \"SegmentDurationSeconds\": 6, \"StreamSelection\": {\"MaxVideoBitsPerSecond\": 2147483647, \
    \"MinVideoBitsPerSecond\": 0, \"StreamOrder\": \"ORIGINAL\"}, \"UseAudioRenditionGroup\": false}, \"Id\": \"MyLiveStreamingHLSEndpoint\", \
    \"ManifestName\": \"index\", \"Origination\": \"ALLOW\", \"StartoverWindowSeconds\": 0, \"Tags\": {\"MediaLive-Workflow\": \"MyLiveStreaming\", \
    \"MSAM-Diagram\": \"MyLiveStreaming\", \"MSAM-Tile\": \"MyLiveStreaming\"}, \"TimeDelaySeconds\": 0, \"Url\": \
    \"https://3ae97e9482b0d011.mediapackage.us-west-2.amazonaws.com/out/v1/9d9f3e3bf04c44efb7e0fc806a546fc3/index.m3u8\", \"Whitelist\": [], \
    \"Encryption\": {\"KeyRotationIntervalSeconds\": 60, \"SpekeKeyProvider\": {\"ResourceId\": \"a14fbe91-c0ee-4b65-b6d6-d5674975319c\", \
    \"RoleArn\": \"arn:aws:iam::1234567890:role/drmtoday-adapter-MediaPackageRole-1Q8QR2XG77Z3S\", \
    \"SystemIds\": [\"edef8ba9-79d6-4ace-a3c8-27dcd51d21ed\"], \"Url\": \"https://bze1m1xgh4.execute-api.us-east-1.amazonaws.com/live/speke/v1.0/copyProtection\"}}}"}]
CACHED_MC_FLOWS = [{"data": "{\"AvailabilityZone\": \"us-east-1a\", \"EgressIp\": \"54.145.77.151\", \"Entitlements\": [], \
    \"FlowArn\": \"arn:aws:mediaconnect:us-east-1:1234567890:flow:1-WVZVV1IMAQhXBVEI-c67d3528bbe6:Plex-Test-Out-0\", \"Name\": \"Plex-Test-Out-0\", \
    \"Outputs\": [{\"Destination\": \"172.31.37.145\", \"MediaStreamOutputConfigurations\": [{\"EncodingName\": \"raw\", \"MediaStreamName\": \"mediatest\"}], \
    \"Name\": \"medialive-1\", \"OutputArn\": \"arn:aws:mediaconnect:us-west-2:1234567890:output:1-Cg8ABVcLBAQHA1BS-d8f6412277e1:medialive-1\", \
    \"Port\": 5000, \"Transport\": {\"Protocol\": \"cdi\"}, \"VpcInterfaceAttachment\": {\"VpcInterfaceName\": \"vpc-efa\"}}], \
    \"Source\": {\"EntitlementArn\": \"arn:aws:mediaconnect:us-east-1:1234567890:entitlement:1-CAVaVVRQUAMLAF0P-43e6ff4eb1d4:Multiplex-2911217-pipeline-0\", \
    \"Name\": \"i075dcd8225a\", \"SourceArn\": \"arn:aws:mediaconnect:us-east-1:1234567890:source:1-WVZVV1IMAQhXBVEI-c67d3528bbe6:i075dcd8225a\"}, \
    \"Sources\": [{\"EntitlementArn\": \"arn:aws:mediaconnect:us-east-1:1234567890:entitlement:1-CAVaVVRQUAMLAF0P-43e6ff4eb1d4:Multiplex-2911217-pipeline-0\", \
    \"Name\": \"i075dcd8225a\", \"SourceArn\": \"arn:aws:mediaconnect:us-east-1:1234567890:source:1-WVZVV1IMAQhXBVEI-c67d3528bbe6:i075dcd8225a\"}], \
    \"Status\": \"STANDBY\", \"Tags\": {}}"}]
CACHED_MC_FLOWS_2 = [{"data": "{\"AvailabilityZone\": \"eu-west-1a\", \"EgressIp\": \"54.145.77.151\", \"Entitlements\": [], \
    \"FlowArn\": \"arn:aws:mediaconnect:eu-west-1:123456789012:flow:1-WVZVV1IMAQhXBVEI-c67d3528bbe6:test\", \
    \"MediaStreams\": [], \"Name\": \"test\", \"Outputs\": [{\"Description\": \"test\", \"ListenerAddress\": \"10.1.2.3\", \"Name\": \"test\", \
    \"OutputArn\": \"arn:aws:mediaconnect:eu-west-1:123456789012:output:1-Cg8ABVcLBAQHA1BS-d8f6412277e1:test\", \"Port\": 1025, \
    \"Transport\": {\"MinLatency\": 1000, \"Protocol\": \"srt-listener\"}, \"VpcInterfaceAttachment\": { \
    \"VpcInterfaceName\": \"vpc_interface\"}}], \"Source\": {\"DataTransferSubscriberFeePercent\": 100, \"Decryption\": { \
    \"Algorithm\": \"aes256\", \"KeyType\": \"static-key\", \"RoleArn\": \"arn:aws:iam::123456789012:role/secrets\", \
    \"SecretArn\": \"arn:aws:secretsmanager:eu-west-1:123456789012:secret:mysecret-aBc123\"}, \
    \"EntitlementArn\": \"arn:aws:mediaconnect:eu-west-1:234567890123:entitlement:1-CAVaVVRQUAMLAF0P-43e6ff4eb1d4:test\", \
    \"Name\": \"test\", \"SourceArn\": \"arn:aws:mediaconnect:eu-west-1:123456789012:source:1-WVZVV1IMAQhXBVEI-c67d3528bbe6:test\"}, \
    \"Sources\": [{\"DataTransferSubscriberFeePercent\": 100, \"Decryption\": {\"Algorithm\": \"aes256\", \"KeyType\": \"static-key\", \
    \"RoleArn\": \"arn:aws:iam::123456789012:role/role\", \"SecretArn\": \"arn:aws:secretsmanager:eu-west-1:123456789012:secret:mysecret-aBc123\"}, \
    \"EntitlementArn\": \"arn:aws:mediaconnect:eu-west-1:234567890123:entitlement:1-CAVaVVRQUAMLAF0P-43e6ff4eb1d4:test\", \"Name\": \"test\", \
    \"SourceArn\": \"arn:aws:mediaconnect:eu-west-1:123456789012:source:1-WVZVV1IMAQhXBVEI-c67d3528bbe6:test\"}], \"Status\": \"STANDBY\", \
    \"VpcInterfaces\": [{\"Name\": \"vpc_interface\", \"NetworkInterfaceIds\": [\"eni-01234456789012345\"], \"NetworkInterfaceType\": \"ena\", \
    \"RoleArn\": \"arn:aws:iam::123456789012:role/role\", \"SecurityGroupIds\": [\"sg-01234456789012345\"], \
    \"SubnetId\": \"subnet-01234456789012345\"}], \"VpcSubnet\": {\"vpc_interface\": \"subnet-01234456789012345\"}, \"Tags\": {}}"}]
CACHED_S3 = [{"arn": "arn:aws:s3:::msam-upgrader-browserappmodu-msambrowserappbucket-1f8ur1bq93ntv",
    "data": "{\"Name\": \"msam-upgrader-browserappmodu-msambrowserappbucket-1f8ur1bq93ntv\", \"CreationDate\": \"2021-03-23 23:29:43+00:00\", \
    \"Tags\": {\"aws:cloudformation:stack-id\": \"arn:aws:cloudformation:us-east-1:1234567890:stack/MSAM-Upgrader-BrowserAppModuleStack-8HNMBO88Y67O/a13d6900-8c2f-11eb-98d8-12f3521c88a3\", \
    \"aws:cloudformation:stack-name\": \"MSAM-Upgrader-BrowserAppModuleStack-8HNMBO88Y67O\", \"aws:cloudformation:logical-id\": \"MSAMBrowserAppBucket\"}}"}]
CACHED_CLOUDFRONT = [{"arn": "arn:aws:cloudfront::1234567890:distribution/E2EFYSTWYTFJBN",
    "data": "{\"Id\": \"E2EFYSTWYTFJBN\", \"ARN\": \"arn:aws:cloudfront::1234567890:distribution/E2EFYSTWYTFJBN\", \"Status\": \"Deployed\", \"LastModifiedTime\": \
    \"2021-05-13 16:26:47.445000+00:00\", \"DomainName\": \"d3a4v622ogtaat.cloudfront.net\", \"Aliases\": {\"Quantity\": 0}, \"Origins\": {\"Quantity\": 1, \
    \"Items\": [{\"Id\": \"msam-upgrader-browserappmodu-msambrowserappbucket-1f8ur1bq93ntv\", \"DomainName\": \"msam-upgrader-browserappmodu-msambrowserappbucket-1f8ur1bq93ntv.s3.amazonaws.com\", \
    \"OriginPath\": \"\", \"CustomHeaders\": {\"Quantity\": 0}, \"S3OriginConfig\": {\"OriginAccessIdentity\": \"origin-access-identity/cloudfront/E2E2NS1ZZJ47XM\"}, \
    \"ConnectionAttempts\": 3, \"ConnectionTimeout\": 10, \"OriginShield\": {\"Enabled\": false}}]}, \"OriginGroups\": {\"Quantity\": 0}, \"DefaultCacheBehavior\": \
    {\"TargetOriginId\": \"msam-upgrader-browserappmodu-msambrowserappbucket-1f8ur1bq93ntv\", \"TrustedSigners\": {\"Enabled\": false, \"Quantity\": 0}, \
    \"TrustedKeyGroups\": {\"Enabled\": false, \"Quantity\": 0}, \"ViewerProtocolPolicy\": \"https-only\", \"AllowedMethods\": {\"Quantity\": 3, \"Items\": \
    [\"HEAD\", \"GET\", \"OPTIONS\"], \"CachedMethods\": {\"Quantity\": 3, \"Items\": [\"HEAD\", \"GET\", \"OPTIONS\"]}}, \"SmoothStreaming\": false, \
    \"Compress\": true, \"LambdaFunctionAssociations\": {\"Quantity\": 0}, \"FunctionAssociations\": {\"Quantity\": 0}, \"FieldLevelEncryptionId\": \"\", \
    \"ForwardedValues\": {\"QueryString\": false, \"Cookies\": {\"Forward\": \"none\"}, \"Headers\": {\"Quantity\": 3, \"Items\": [\"Origin\", \"Access-Control-Request-Method\", \
    \"Access-Control-Request-Headers\"]}, \"QueryStringCacheKeys\": {\"Quantity\": 0}}, \"MinTTL\": 3600, \"DefaultTTL\": 7200, \"MaxTTL\": 86400}, \
    \"CacheBehaviors\": {\"Quantity\": 0}, \"CustomErrorResponses\": {\"Quantity\": 0}, \"Comment\": \"CDN for msam-upgrader-browserappmodu-msambrowserappbucket-1f8ur1bq93ntv\", \
    \"PriceClass\": \"PriceClass_All\", \"Enabled\": true, \"ViewerCertificate\": {\"CloudFrontDefaultCertificate\": true, \"SSLSupportMethod\": \"vip\", \
    \"MinimumProtocolVersion\": \"TLSv1\", \"CertificateSource\": \"cloudfront\"}, \"Restrictions\": {\"GeoRestriction\": {\"RestrictionType\": \"none\", \"Quantity\": 0}}, \
    \"WebACLId\": \"\", \"HttpVersion\": \"HTTP1_1\", \"IsIPV6Enabled\": true, \"Tags\": {\"MSAM-Diagram\": \"MyLiveStreaming\", \"MSAM-Tile\": \"MyLiveStreaming\", \"MediaLive-Workflow\": \"MyLiveStreaming\", \
     \"mediapackage:cloudfront_assoc\": \"arn:aws:mediapackage:us-west-2:1234567890:channels/286eb42a8bf44695a44bdb48e4fb6f3f\"}}"}]
CACHED_SPEKE = [{"arn": "arn:oss:speke:::714958406217327359", "data": "{\"arn\": \"arn:oss:speke:::714958406217327359\", \
    \"endpoint\": \"https://bze1m1xgh4.execute-api.us-east-1.amazonaws.com/live/speke/v1.0/copyProtection\", \"scheme\": \"https\"}"}]
CACHED_MT_CONFIG = [{"data": "{\"AdDecisionServerUrl\": \"http://someadserver.com\", \"Name\": \"MyTestCampaign\", \
    \"PlaybackConfigurationArn\": \"arn:aws:mediatailor:us-west-2:1234567890:playbackConfiguration/MyTestCampaign\", \"PlaybackEndpointPrefix\": \
    \"https://41f9edfcda1d4ad2916c50d575858b47.mediatailor.us-west-2.amazonaws.com\", \"SessionInitializationEndpointPrefix\": \
    \"https://41f9edfcda1d4ad2916c50d575858b47.mediatailor.us-west-2.amazonaws.com/v1/session/cf6421621b389b384c1fd22e51603ee95db76ae0/MyTestCampaign/\", \
    \"Tags\": {}, \"VideoContentSourceUrl\": \"https://3ae97e9482b0d011.mediapackage.us-west-2.amazonaws.com/out/v1/9d9f3e3bf04c44efb7e0fc806a546fc3/index.m3u8\"}"},
    {"data": "{\"AdDecisionServerUrl\": \"http://someadserver.com\", \"Name\": \"MyTestCampaign\", \
    \"PlaybackConfigurationArn\": \"arn:aws:mediatailor:us-west-2:1234567890:playbackConfiguration/MyTestCampaign\", \"PlaybackEndpointPrefix\": \
    \"https://41f9edfcda1d4ad2916c50d575858b47.mediatailor.us-west-2.amazonaws.com\", \"SessionInitializationEndpointPrefix\": \
    \"https://41f9edfcda1d4ad2916c50d575858b47.mediatailor.us-west-2.amazonaws.com/v1/session/cf6421621b389b384c1fd22e51603ee95db76ae0/MyTestCampaign/\", \
    \"Tags\": {}, \"VideoContentSourceUrl\": \"https://s3-us-west-2.amazonaws.com/msam-upgrader-browserappmodu-msambrowserappbucket-1f8ur1bq93ntv/caminandes\"}"},
    {"data": "{\"AdDecisionServerUrl\": \"http://someadserver.com\", \"Name\": \"MyTestCampaign\", \
    \"PlaybackConfigurationArn\": \"arn:aws:mediatailor:us-west-2:1234567890:playbackConfiguration/MyTestCampaign\", \"PlaybackEndpointPrefix\": \
    \"https://41f9edfcda1d4ad2916c50d575858b47.mediatailor.us-west-2.amazonaws.com\", \"SessionInitializationEndpointPrefix\": \
    \"https://41f9edfcda1d4ad2916c50d575858b47.mediatailor.us-west-2.amazonaws.com/v1/session/cf6421621b389b384c1fd22e51603ee95db76ae0/MyTestCampaign/\", \
    \"Tags\": {}, \"VideoContentSourceUrl\": \"https://oszgjooyyimoxd.data.mediastore.us-west-2.amazonaws.com\"}"}]


@patch('boto3.client')
@patch('boto3.resource')
@patch('os.environ')
class TestConnections(unittest.TestCase):
    """
    This class extends TestCase with testing functions
    """

    def test_connection_item(self, patched_env, patched_resource,
                             patched_client):
        """
        Test the connection_item function
        """
        from chalicelib import connections
        item = connections.connection_item("arn", "from", "to", "service",
                                           {"config": True})
        self.assertTrue(
            item.get("arn") == "arn" and item.get("from") == "from"
            and item.get("to") == "to" and item.get("service") == "service")

    def test_connection_to_ddb_item(self, patched_env, patched_resource,
                                    patched_client):
        """
        Test the connection_to_ddb_item function
        """
        from chalicelib import connections
        item = connections.connection_to_ddb_item("from", "to", "service", {
            "config": True,
            "pipeline": "0"
        })
        self.assertTrue(
            item.get("arn") == "from:to" and item.get("from") == "from"
            and item.get("to") == "to" and item.get("service") == "service")

    def test_connection_to_ddb_item_pl(self, patched_env, patched_resource,
                                       patched_client):
        """
        Test the connection_to_ddb_item_pl function
        """
        from chalicelib import connections
        item = connections.connection_to_ddb_item_pl("from", "to", "service", {
            "config": True,
            "pipeline": "1"
        })
        self.assertTrue(
            item.get("arn") == "from:to:1" and item.get("from") == "from"
            and item.get("to") == "to" and item.get("service") == "service")

    def test_fetch_running_pipelines_count(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the fetch_running_pipelines_count function
        """
        from chalicelib import connections
        count = connections.fetch_running_pipelines_count(
            {"ChannelClass": "STANDARD"})
        self.assertTrue(count == 2)
        count = connections.fetch_running_pipelines_count(
            {"ChannelClass": "NOT-STANDARD"})
        self.assertTrue(count == 1)
        count = connections.fetch_running_pipelines_count(
            {"Destinations": []})
        self.assertTrue(count == 0)


    def test_update_connection_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the update_connection_ddb_items function
        """
        from chalicelib import connections, content
        connections.update_connection_ddb_items()
        
        with patch.object(content, 'put_ddb_items', side_effect=CLIENT_ERROR):
            connections.update_connection_ddb_items()
            self.assertRaises(ClientError)

    def test_mediastore_container_medialive_input_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediastore_container_medialive_input_ddb_items function
        """
        from chalicelib import connections, cache
        # first side effect is the return for eml input, second is for ems
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_INPUTS, CACHED_MS_CONTAINERS)):
            connections.mediastore_container_medialive_input_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediastore_container_medialive_input_ddb_items()

    def test_medialive_channel_mediapackage_channel_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the medialive_channel_mediapackage_channel_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS, CACHED_MP_CHANNELS)):
            connections.medialive_channel_mediapackage_channel_ddb_items()
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS_2, CACHED_MP_CHANNELS)):
            connections.medialive_channel_mediapackage_channel_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.medialive_channel_mediapackage_channel_ddb_items()

    def test_medialive_channel_mediastore_container_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the medialive_channel_mediastore_container_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS, CACHED_MS_CONTAINERS)):
            connections.medialive_channel_mediastore_container_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.medialive_channel_mediastore_container_ddb_items()


    def test_medialive_channel_multiplex_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the medialive_channel_multiplex_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS, CACHED_MULTIPLEX)):
            connections.medialive_channel_multiplex_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.medialive_channel_multiplex_ddb_items()


    def test_medialive_input_medialive_channel_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the medialive_input_medialive_channel_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS, CACHED_ML_INPUTS)):
            connections.medialive_input_medialive_channel_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.medialive_input_medialive_channel_ddb_items()


    def test_mediapackage_channel_mediapackage_endpoint_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediapackage_channel_mediapackage_endpoint_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_MP_CHANNELS, CACHED_MP_ENDPOINTS)):
            connections.mediapackage_channel_mediapackage_endpoint_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediapackage_channel_mediapackage_endpoint_ddb_items()

    def test_multiplex_mediaconnect_flow_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the multiplex_mediaconnect_flow_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_MULTIPLEX, CACHED_MC_FLOWS)):
            connections.multiplex_mediaconnect_flow_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.multiplex_mediaconnect_flow_ddb_items()

    def test_s3_bucket_cloudfront_distribution_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the s3_bucket_cloudfront_distribution_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_S3, CACHED_CLOUDFRONT)):
            connections.s3_bucket_cloudfront_distribution_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.s3_bucket_cloudfront_distribution_ddb_items()

    def test_s3_bucket_medialive_input_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the s3_bucket_medialive_input_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_S3, CACHED_ML_INPUTS)):
            connections.s3_bucket_medialive_input_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.s3_bucket_medialive_input_ddb_items()

    def test_cloudfront_distribution_medialive_input_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the cloudfront_distribution_medialive_input_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_CLOUDFRONT, CACHED_ML_INPUTS)):
            connections.cloudfront_distribution_medialive_input_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.cloudfront_distribution_medialive_input_ddb_items()

    def test_mediapackage_endpoint_cloudfront_distribution_by_tag_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediapackage_endpoint_cloudfront_distribution_by_tag_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_CLOUDFRONT, CACHED_MP_CHANNELS, CACHED_MP_ENDPOINTS)):
            connections.mediapackage_endpoint_cloudfront_distribution_by_tag_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediapackage_endpoint_cloudfront_distribution_by_tag_ddb_items()

    def test_mediapackage_endpoint_cloudfront_distribution_by_origin_url_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediapackage_endpoint_cloudfront_distribution_by_origin_url_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_CLOUDFRONT, CACHED_MP_ENDPOINTS)):
            connections.mediapackage_endpoint_cloudfront_distribution_by_origin_url_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediapackage_endpoint_cloudfront_distribution_by_origin_url_ddb_items()


    def test_mediapackage_endpoint_speke_keyserver_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediapackage_endpoint_cloudfront_distribution_by_origin_url_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_SPEKE, CACHED_MP_ENDPOINTS)):
            connections.mediapackage_endpoint_speke_keyserver_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediapackage_endpoint_speke_keyserver_ddb_items()


    def test_mediaconnect_flow_medialive_input_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediaconnect_flow_medialive_input_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_MC_FLOWS, CACHED_ML_INPUTS)):
            connections.mediaconnect_flow_medialive_input_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediaconnect_flow_medialive_input_ddb_items()

    def test_mediaconnect_flow_mediaconnect_flow_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediaconnect_flow_mediaconnect_flow_ddb_items function
        """
        from chalicelib import connections, cache
        for se in [CACHED_MC_FLOWS, CACHED_MC_FLOWS_2]:
            with patch.object(cache, 'cached_by_service', side_effect=(se, se)):
                connections.mediaconnect_flow_mediaconnect_flow_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediaconnect_flow_mediaconnect_flow_ddb_items()

    def test_mediapackage_endpoint_mediatailor_configuration_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediapackage_endpoint_mediatailor_configuration_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_MP_ENDPOINTS, CACHED_MT_CONFIG)):
            connections.mediapackage_endpoint_mediatailor_configuration_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediapackage_endpoint_mediatailor_configuration_ddb_items()

    def test_mediastore_container_mediatailor_configuration_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the s3_bucket_mediatailor_configuration_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_MT_CONFIG, CACHED_MS_CONTAINERS)):
            connections.mediastore_container_mediatailor_configuration_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediastore_container_mediatailor_configuration_ddb_items()

    def test_s3_bucket_mediatailor_configuration_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the s3_bucket_mediatailor_configuration_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_S3, CACHED_MT_CONFIG)):
            connections.s3_bucket_mediatailor_configuration_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.s3_bucket_mediatailor_configuration_ddb_items()

    def test_mediastore_container_cloudfront_distribution_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the mediastore_container_cloudfront_distribution_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_CLOUDFRONT, CACHED_MS_CONTAINERS)):
            connections.mediastore_container_cloudfront_distribution_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.mediastore_container_cloudfront_distribution_ddb_items()

    def test_medialive_channel_s3_bucket_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the medialive_channel_s3_bucket_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS, CACHED_S3)):
            connections.medialive_channel_s3_bucket_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.medialive_channel_s3_bucket_ddb_items()

    # def test_link_device_medialive_input_ddb_items(self, patched_env, patched_resource,
    #                                        patched_client):
    #     """
    #     Test the link_device_medialive_input_ddb_items function
    #     """
    #     from chalicelib import connections, cache
    #     with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS, CACHED_S3)):
    #         connections.link_device_medialive_input_ddb_items()
    #     # exception
    #     with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
    #         connections.link_device_medialive_input_ddb_items()

    def test_medialive_channel_medialive_input_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the medialive_channel_medialive_input_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS, CACHED_ML_INPUTS)):
            connections.medialive_channel_medialive_input_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.medialive_channel_medialive_input_ddb_items()

    def test_medialive_channel_mediaconnect_flow_ddb_items(self, patched_env, patched_resource,
                                           patched_client):
        """
        Test the medialive_channel_mediaconnect_flow_ddb_items function
        """
        from chalicelib import connections, cache
        with patch.object(cache, 'cached_by_service', side_effect=(CACHED_ML_CHANNELS, CACHED_MC_FLOWS)):
            connections.medialive_channel_mediaconnect_flow_ddb_items()
        # exception
        with patch.object(cache, 'cached_by_service', side_effect=CLIENT_ERROR):
            connections.medialive_channel_mediaconnect_flow_ddb_items()
