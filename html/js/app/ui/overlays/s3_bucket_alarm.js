/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/alarms"], function($, _, alarms) {

    var match_type = "S3 Bucket";
    var name = match_type + " Alarm";

    var decorate = function(drawing, font_size, width, height, id) {
        var alarm_count = 0;
        alarms.get_subscribers_with_alarms().current.forEach(function(item) {
            if (item.ResourceArn == id) {
                alarm_count = item.AlarmCount;
            }
        });
        var typeLabel = drawing.text("Active alarms: " + alarm_count).y(154);
        typeLabel.font({
            family: 'Arial',
            size: font_size
        });
        typeLabel.cx(width / 2);
    };

    return {
        "match_type": match_type,
        "name": name,
        "decorate": decorate
    };

});