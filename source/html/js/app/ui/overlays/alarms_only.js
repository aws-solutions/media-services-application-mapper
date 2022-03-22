/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as alarms from "../../alarms.js";
import * as tools from "./overlay_tools.js";

export const match_type = "Default Overlay for Alarms";

const decorate_alarms = function (drawing, font_size, width, height, id) {
    let alarm_count = 0;
    for (let item of alarms.get_subscribers_with_alarms().current) {
        if (item.ResourceArn == id) {
            alarm_count += item.AlarmCount;
        }
    }
    tools.set_alarm_text(alarm_count, drawing, font_size, width);
};

export const decorate = function (drawing, font_size, width, height, id) {
    decorate_alarms(drawing, font_size, width, height, id);
};

export const informational = false;

