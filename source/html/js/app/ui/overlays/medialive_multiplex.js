/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(['jquery', 'lodash', 'app/events', 'app/alarms', 'app/ui/overlays/overlay_tools'],
    function($, _, alert_events, alarms, tools) {
        const match_type = 'MediaLive Multiplex';

        const decorate_alarms = function(drawing, font_size, width, height, id) {
            let alarm_count = 0;
            for (let item of alarms.get_subscribers_with_alarms().current) {
                if (item.ResourceArn == id) {
                    alarm_count += item.AlarmCount;
                }
            }
            tools.set_alarm_text(alarm_count, drawing, font_size, width);
        };

        const decorate_events = function(drawing, font_size, width, height, id, data) {
            const isSinglePipeline = tools.has_single_pipeline(id, data);
            let pipeline_alerts = isSinglePipeline ? 0 : [0, 0];
            for (let item of alert_events.get_cached_events().current_medialive) {
                if (item.resource_arn == id) {
                    if (isSinglePipeline) pipeline_alerts += 1;
                    else pipeline_alerts[parseInt(item.detail.pipeline)] += 1;
                }
            }

            tools.set_event_text(pipeline_alerts, drawing, font_size, width);
        };

        const decorate = function(drawing, font_size, width, height, id, data) {
            decorate_alarms(drawing, font_size, width, height, id, data);
            decorate_events(drawing, font_size, width, height, id, data);
        };

        return { match_type, decorate, informational: true };
    });