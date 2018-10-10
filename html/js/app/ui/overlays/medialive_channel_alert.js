/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/events"], function($, _, alert_events) {

    var match_type = "MediaLive Channel";
    var name = match_type + " Alert";

    var decorate = function(drawing, font_size, width, height, id) {
        // console.log(id);
        var pipeline_alerts = [0, 0];
        alert_events.get_cached_events().current.forEach(function(item) {
            // console.log(item);
            if (item.resource_arn == id) {
                pipeline_alerts[parseInt(item.detail.pipeline)] += 1;
            }
        });
        var typeLabel = drawing.text("Pipeline alerts: " + JSON.stringify(pipeline_alerts)).y(125);
        typeLabel.font({
            family: 'Arial',
            size: font_size
        });
        typeLabel.cx(width / 2);
    };

    // alert_events.add_listener(alert_listener);

    return {
        "match_type": match_type,
        "name": name,
        "decorate": decorate
    };

});