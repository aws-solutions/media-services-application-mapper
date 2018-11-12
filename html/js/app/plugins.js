/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define({
    "nodes": [
        "app/mappers/nodes/cloudfront",
        "app/mappers/nodes/medialive",
        "app/mappers/nodes/mediapackage",
        "app/mappers/nodes/mediastore",
        "app/mappers/nodes/s3",
        "app/mappers/nodes/speke",
        "app/mappers/nodes/user_defined_node"
    ],
    "connections": [
        "app/mappers/connections/cloudfront_medialive_input",
        "app/mappers/connections/medialive_channel_mediapackage_channel",
        "app/mappers/connections/medialive_channel_mediastore_container",
        "app/mappers/connections/medialive_input_channel",
        "app/mappers/connections/mediapackage_channel_endpoint",
        "app/mappers/connections/mediapackage_endpoint_cloudfront",
        "app/mappers/connections/mediastore_container_medialive_input",
        "app/mappers/connections/s3_bucket_medialive_input",
        "app/mappers/connections/s3_bucket_cloudfront",
        "app/mappers/connections/speke",
        "app/mappers/connections/user_defined_connection"
    ],
    "tools": [
        "app/tools/build_numbers",
        "app/tools/clear_http",
        "app/tools/cross_region",
        "app/tools/duplicate_names"
    ],
    "overlays": [
        "app/ui/overlays/cloudfront_distribution_alarm",
        "app/ui/overlays/elemental_live_encoder_alarm",
        "app/ui/overlays/firewall_alarm",
        "app/ui/overlays/medialive_channel_alert",
        "app/ui/overlays/medialive_channel_alarm",
        "app/ui/overlays/medialive_input_alarm",
        "app/ui/overlays/mediapackage_channel_alarm",
        "app/ui/overlays/mediapackage_endpoint_alarm",
        "app/ui/overlays/mediastore_container_alarm",
        "app/ui/overlays/s3_bucket_alarm",
        "app/ui/overlays/speke_keyserver_alarm"
    ]
});