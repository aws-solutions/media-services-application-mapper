/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as overlay_mediaconnect_flow from "./mediaconnect_flow.js";
import * as overlay_medialive_channel from "./medialive_channel.js";
import * as overlay_medialive_multiplex from "./medialive_multiplex.js";
import * as overlay_ssm_managed_instance from "./ssm_managed_instance.js";
import * as overlay_ec2_instance from "./ec2_instance.js";
import * as overlay_alarms_only from "./alarms_only.js";

export const all = [
    overlay_mediaconnect_flow,
    overlay_medialive_channel,
    overlay_medialive_multiplex,
    overlay_ssm_managed_instance,
    overlay_ec2_instance,
];

export const default_overlay = overlay_alarms_only;
