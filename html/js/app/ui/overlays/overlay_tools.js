/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(['jquery', 'lodash', 'app/events', 'app/alarms'], function($, _, alert_events, alarms) {
    const info_y = 80;
    const event_y = 125;
    const alarm_y = 154;
    const generateText = (type, data) => `${type}: ${JSON.stringify(data)}`;

    const fetch_running_pipelines_count = data => {
        let pipelines_count = 0;

        if (_.has(data, 'ChannelClass')) {
            if (data.ChannelClass === 'STANDARD') pipelines_count = 2;
            else pipelines_count = 1;
        } else if (_.has(data, 'Destinations')) pipelines_count = data.Destinations.length;

        return pipelines_count;
    };

    const has_single_pipeline = (id, data) => {
        const pipelines = {};
        let pipelines_count = 0;

        if (data) {
            if (_.has(data, 'PipelinesRunningCount') && data.PipelinesRunningCount > 1)
                return false;

            pipelines_count = fetch_running_pipelines_count(data);

            if (pipelines_count > 1)
                return false;
        }

        const cached_events = alert_events.get_cached_events();

        for (let item of cached_events.current) {
            if (item.resource_arn == id) pipelines[parseInt(item.detail.pipeline)] += 1;
            if (_.keys(pipelines).length > 1 && pipelines_count > 1) return false;
        }

        return true;
    };

    const draw_font_set_position = function(typeLabel, font_size, width) {
        typeLabel.font({ family: 'Arial', size: font_size });
        typeLabel.cx(width / 2);
    };

    const set_alarm_text = function(data, drawing, font_size, width) {
        const typeLabel = drawing.text(generateText('Active alarms', data)).y(alarm_y);
        draw_font_set_position(typeLabel, font_size, width);
    };

    const set_event_text = function(data, drawing, font_size, width, text = 'Pipeline alerts') {
        const typeLabel = drawing.text(generateText(text, data)).y(event_y);
        draw_font_set_position(typeLabel, font_size, width);
    };

    const set_info_text = function(data, drawing, font_size, width) {
        const typeLabel = drawing.text(generateText('Type', data)).y(info_y);
        draw_font_set_position(typeLabel, font_size, width);
    };

    return { set_alarm_text, set_event_text, set_info_text, has_single_pipeline };
});