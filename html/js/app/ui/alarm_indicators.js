/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/alarms"], function($, _, model, alarms) {

    var updateAlarmState = function(current_alarming_subscribers, previous_alarming_subscribers) {
        // iterate through current 'set' alerts
        var alarming_nodes = [];
        var inactive_nodes = [];
        $.each(current_alarming_subscribers, function(index, subscriber) {
            var node = model.nodes.get(subscriber.ResourceArn);
            if (node) {
                // track which nodes are signaling an alert
                if (!alarming_nodes.includes(subscriber.ResourceArn)) {
                    alarming_nodes.push(subscriber.ResourceArn);
                    // console.log("setting alert color for " + node.id);
                    node.image.selected = node.render.alert_selected();
                    node.image.unselected = node.render.alert_unselected();
                    model.nodes.update(node);
                }
            }
        });

        // calculate the current alerts not included in the previous alerts
        previous_alarming_subscribers.forEach(function(subscriber) {
            var found = false;
            alarming_nodes.forEach(function(node_id) {
                found = found || node_id == subscriber.ResourceArn;
            });
            if (!found) {
                inactive_nodes.push(subscriber.ResourceArn);
            }
        });

        // 'unalert' the nodes that are no longer alerting
        $.each(inactive_nodes, function(index, node_id) {
            var node = model.nodes.get(node_id);
            if (node) {
                node.image.selected = node.render.normal_selected();
                node.image.unselected = node.render.normal_unselected();
                model.nodes.update(node);
            }
        });
    };

    alarms.add_listener(updateAlarmState);
});