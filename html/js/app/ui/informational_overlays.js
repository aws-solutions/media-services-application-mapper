/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/plugins"], function($, _, model, plugins) {

    // interval in millis to update the cache

    var update_interval = 5000;

    var intervalID;

    var update_overlay = function() {
        // console.log("info overlay update");
        // get all the overlays
        for (let module_name of plugins.overlays) {
            var ov = require(module_name);
            if (ov.informational == true) {
                var nodes = model.nodes.get({
                    filter: function(item) {
                        return ov.match_type == item.title;
                    }
                });
                for (let node of nodes) {
                    if (node.alerting || node.alarming) {
                        var selected = node.render.alert_selected();
                        var unselected = node.render.alert_unselected();
                        // only update the node if the SVG changes
                        if (selected != node.image.selected || unselected != node.image.unselected) {
                            node.image.selected = selected;
                            node.image.unselected = unselected;
                            model.nodes.update(node);
                        }
                    } else {
                        var selected = node.render.normal_selected();
                        var unselected = node.render.normal_unselected();
                        if (selected != node.image.selected || unselected != node.image.unselected) {
                            node.image.selected = selected;
                            node.image.unselected = unselected;
                            model.nodes.update(node);
                        }
                    }
                }
            }
        }
    };

    var schedule_interval = function() {
        if (intervalID) {
            clearInterval(intervalID);
        }
        intervalID = setInterval(update_overlay, update_interval);
        console.log("informational overlays: interval scheduled " + update_interval + "ms, intervalID = " + intervalID);
    };

    schedule_interval();
});