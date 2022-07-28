/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as node_cloudfront from "./nodes/cloudfront.js";
import * as node_medialive from "./nodes/medialive.js";
import * as node_mediapackage from "./nodes/mediapackage.js";
import * as node_mediastore from "./nodes/mediastore.js";
import * as node_s3 from "./nodes/s3.js";
import * as node_speke from "./nodes/speke.js";
import * as node_user_defined_node from "./nodes/user_defined_node.js";
import * as node_mediatailor from "./nodes/mediatailor.js";
import * as node_ec2 from "./nodes/ec2.js";
import * as node_ssm_managed_instance from "./nodes/ssm_managed_instance.js";
import * as node_mediaconnect from "./nodes/mediaconnect.js"

export const nodes = [
    node_cloudfront,
    node_medialive,
    node_mediapackage,
    node_mediastore,
    node_s3,
    node_speke,
    node_user_defined_node,
    node_mediatailor,
    node_ec2,
    node_ssm_managed_instance,
    node_mediaconnect
];

import * as conn_cloudfront_medialive_input from "./connections/cloudfront_medialive_input.js";
import * as conn_mediaconnect_flow_medialive_input from "./connections/mediaconnect_flow_medialive_input.js";
import * as conn_mediaconnect_flow_mediaconnect_flow from "./connections/mediaconnect_flow_mediaconnect_flow.js";
import * as conn_medialive_channel_mediapackage_channel from "./connections/medialive_channel_mediapackage_channel.js";
import * as conn_medialive_channel_mediastore_container from "./connections/medialive_channel_mediastore_container.js";
import * as conn_medialive_input_channel from "./connections/medialive_input_channel.js";
import * as conn_medialive_channel_multiplex from "./connections/medialive_channel_multiplex.js";
import * as conn_multiplex_mediaconnect_flow from "./connections/multiplex_mediaconnect_flow.js";
import * as conn_mediapackage_channel_endpoint from "./connections/mediapackage_channel_endpoint.js";
import * as conn_mediapackage_endpoint_cloudfront from "./connections/mediapackage_endpoint_cloudfront.js";
import * as conn_mediastore_container_medialive_input from "./connections/mediastore_container_medialive_input.js";
import * as conn_s3_bucket_medialive_input from "./connections/s3_bucket_medialive_input.js";
import * as conn_s3_bucket_cloudfront from "./connections/s3_bucket_cloudfront.js";
import * as conn_speke from "./connections/speke.js";
import * as conn_user_defined_connection from "./connections/user_defined_connection.js";
import * as conn_mediapackage_endpoint_mediatailor_configuration from "./connections/mediapackage_endpoint_mediatailor_configuration.js";
import * as conn_s3_bucket_mediatailor_configuration from "./connections/s3_bucket_mediatailor_configuration.js";
import * as conn_mediastore_container_mediatailor_configuration from "./connections/mediastore_container_mediatailor_configuration.js";
import * as conn_mediastore_container_cloudfront from "./connections/mediastore_container_cloudfront.js";
import * as conn_medialive_channel_s3_bucket from "./connections/medialive_channel_s3_bucket.js";
import * as conn_link_device_medialive_input from "./connections/link_device_medialive_input.js";
import * as conn_medialive_channel_input from "./connections/medialive_channel_input.js";
import * as conn_medialive_channel_mediaconnect_flow from "./connections/medialive_channel_mediaconnect_flow.js";

export const connections = [
    conn_cloudfront_medialive_input,
    conn_mediaconnect_flow_medialive_input,
    conn_mediaconnect_flow_mediaconnect_flow,
    conn_medialive_channel_mediapackage_channel,
    conn_medialive_channel_mediastore_container,
    conn_medialive_input_channel,
    conn_medialive_channel_multiplex,
    conn_multiplex_mediaconnect_flow,
    conn_mediapackage_channel_endpoint,
    conn_mediapackage_endpoint_cloudfront,
    conn_mediastore_container_medialive_input,
    conn_s3_bucket_medialive_input,
    conn_s3_bucket_cloudfront,
    conn_speke,
    conn_user_defined_connection,
    conn_mediapackage_endpoint_mediatailor_configuration,
    conn_s3_bucket_mediatailor_configuration,
    conn_mediastore_container_mediatailor_configuration,
    conn_mediastore_container_cloudfront,
    conn_medialive_channel_s3_bucket,
    conn_link_device_medialive_input,
    conn_medialive_channel_input,
    conn_medialive_channel_mediaconnect_flow,
];
