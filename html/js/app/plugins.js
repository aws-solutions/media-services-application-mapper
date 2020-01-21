/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define({
    "nodes": [
        "app/mappers/nodes/cloudfront",
        "app/mappers/nodes/mediaconnect",
        "app/mappers/nodes/medialive",
        "app/mappers/nodes/mediapackage",
        "app/mappers/nodes/mediastore",
        "app/mappers/nodes/s3",
        "app/mappers/nodes/speke",
        "app/mappers/nodes/user_defined_node",
        "app/mappers/nodes/mediatailor",
        "app/mappers/nodes/ec2",
        "app/mappers/nodes/ssm_managed_instance"
    ],
    "connections": [
        "app/mappers/connections/cloudfront_medialive_input",
        "app/mappers/connections/mediaconnect_flow_medialive_input",
        "app/mappers/connections/mediaconnect_flow_mediaconnect_flow",
        "app/mappers/connections/medialive_channel_mediapackage_channel",
        "app/mappers/connections/medialive_channel_mediastore_container",
        "app/mappers/connections/medialive_input_channel",
        "app/mappers/connections/medialive_channel_multiplex",
        "app/mappers/connections/multiplex_mediaconnect_flow",
        "app/mappers/connections/mediapackage_channel_endpoint",
        "app/mappers/connections/mediapackage_endpoint_cloudfront",
        "app/mappers/connections/mediastore_container_medialive_input",
        "app/mappers/connections/s3_bucket_medialive_input",
        "app/mappers/connections/s3_bucket_cloudfront",
        "app/mappers/connections/speke",
        "app/mappers/connections/user_defined_connection",
        "app/mappers/connections/mediapackage_endpoint_mediatailor_configuration",
        "app/mappers/connections/s3_bucket_mediatailor_configuration",
        "app/mappers/connections/mediastore_container_mediatailor_configuration"
    ],
    "tools": [
        "app/tools/build_numbers",
        "app/tools/clear_http",
        "app/tools/cross_region",
        "app/tools/duplicate_names"
    ],
    "overlays": [
        "app/ui/overlays/mediaconnect_flow",
        "app/ui/overlays/medialive_channel",
    ],
    "default-overlay": "app/ui/overlays/alarms_only"
});