/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/alarms"], function($, _, alarms) {

    var info_y = 80;
    var event_y = 125;
    var alarm_y = 154;

    var draw_font_set_position = function(typeLabel, font_size, width) {
        typeLabel.font({
            family: 'Arial',
            size: font_size
        });
        typeLabel.cx(width / 2);

    }

    var set_alarm_text = function(text, drawing, font_size, width) {
        var typeLabel = drawing.text(text).y(alarm_y);
        draw_font_set_position(typeLabel, font_size, width);
    }

    var set_event_text = function(text, drawing, font_size, width) {
        var typeLabel = drawing.text(text).y(event_y);
        draw_font_set_position(typeLabel, font_size, width);
    }

    var set_info_text = function(text, drawing, font_size, width) {
        var typeLabel = drawing.text(text).y(info_y);
        draw_font_set_position(typeLabel, font_size, width);
    }

    return {
        "set_alarm_text": set_alarm_text,
        "set_event_text": set_event_text,
        "set_info_text": set_info_text
    };

});