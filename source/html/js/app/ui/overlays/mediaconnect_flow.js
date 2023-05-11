/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as alert_events from "../../events.js";
import * as alarms from "../../alarms.js";
import * as tools from "./overlay_tools.js";
import * as model from "../../model.js";

export const match_type = "MediaConnect Flow";

const decorate_alarms = function (drawing, font_size, width, height, id) {
    let alarm_count = 0;
    for (const item of alarms.get_subscribers_with_alarms().current) {
        if (item.ResourceArn == id) {
            alarm_count += item.AlarmCount;
        }
    }
    tools.set_alarm_text(alarm_count, drawing, font_size, width);
};

const decorate_information = function (drawing, font_size, width, height, id) {
    const node = model.nodes.get(id);
    if (node) {
        let source_type = "Standard";
        if (node.data.Source.EntitlementArn) {
            source_type = "Entitlement";
        }
        else if (node.data.VpcInterfaces) {
            source_type = "VPC";            
        } 
        tools.set_info_text(source_type, drawing, font_size, width);
    }
};

const decorate_alerts = function (drawing, font_size, width, height, id) {
    let alert_count = 0;
    for (const item of alert_events.get_cached_events().current_mediaconnect) {
        if (item.resource_arn == id) {
            alert_count += 1;
        }
    }
    tools.set_event_text(alert_count, drawing, font_size, width, "Alerts");
};

export const decorate = function (drawing, font_size, width, height, id) {
    decorate_alarms(drawing, font_size, width, height, id);
    decorate_alerts(drawing, font_size, width, height, id);
    decorate_information(drawing, font_size, width, height, id);
};

export const informational = true;
