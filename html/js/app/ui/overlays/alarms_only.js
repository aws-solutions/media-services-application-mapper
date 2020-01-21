/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */


define(["jquery", "lodash", "app/alarms", "app/ui/overlays/overlay_tools"],
    function($, _, alarms, tools) {

        var match_type = "Default Overlay for Alarms";

        var decorate_alarms = function(drawing, font_size, width, height, id) {
            var alarm_count = 0;
            for (let item of alarms.get_subscribers_with_alarms().current) {
                if (item.ResourceArn == id) {
                    alarm_count += item.AlarmCount;
                }
            }
            tools.set_alarm_text("Active alarms: " + alarm_count, drawing, font_size, width);
        };

        var decorate = function(drawing, font_size, width, height, id) {
            decorate_alarms(drawing, font_size, width, height, id);
        };

        return {
            "match_type": match_type,
            "decorate": decorate,
            "informational": false
        };

    });