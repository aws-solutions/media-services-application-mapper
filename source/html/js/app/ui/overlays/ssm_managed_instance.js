/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/events", "app/alarms", "app/ui/overlays/overlay_tools", "app/model"],
    function($, _, alert_events, alarms, tools, model) {

        var match_type = "SSM Managed Instance";

        var decorate_alarms = function(drawing, font_size, width, height, id) {
            var alarm_count = 0;
            for (let item of alarms.get_subscribers_with_alarms().current) {
                if (item.ResourceArn == id) {
                    alarm_count += item.AlarmCount;
                }
            }
            tools.set_alarm_text(alarm_count, drawing, font_size, width);
        };

        var decorate_information = function(drawing, font_size, width, height, id) {
            var node = model.nodes.get(id);
            if (node) {
                if (node.data.Data["AWS:InstanceInformation"].Content[0].ComputerName) {
                    let computer_name = node.data.Data["AWS:InstanceInformation"].Content[0].ComputerName;
                    tools.set_info_text(computer_name, drawing, font_size, width, "Name");
                }
            }
        };

        var decorate = function(drawing, font_size, width, height, id) {
            decorate_alarms(drawing, font_size, width, height, id);
            decorate_information(drawing, font_size, width, height, id);
        };

        return { match_type, decorate, informational: true };
    });