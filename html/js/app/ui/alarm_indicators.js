/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/alarms", "app/ui/diagrams"],
    function($, _, model, alarms, diagrams) {

        var updateAlarmState = function(current_alarming_subscribers, previous_alarming_subscribers) {
            // iterate through current 'set' alerts
            var alarming_nodes = [];
            var inactive_nodes = [];
            $.each(current_alarming_subscribers, function(index, subscriber) {
                var node = model.nodes.get(subscriber.ResourceArn);
                if (node) {
                    node.alarming = true;
                    // track which nodes are signaling an alert
                    if (!alarming_nodes.includes(subscriber.ResourceArn)) {
                        alarming_nodes.push(subscriber.ResourceArn);
                        // console.log("setting alert color for " + node.id);
                        var selected = node.render.alert_selected();
                        var unselected = node.render.alert_unselected();
                        // only update the node if the SVG changes
                        if (selected != node.image.selected || unselected != node.image.unselected) {
                            node.image.selected = selected;
                            node.image.unselected = unselected;
                            model.nodes.update(node);
                            var matches = diagrams.have_all([node.id]);
                            // console.log(matches);
                            matches.forEach(function(diagram) {
                                diagram.nodes.update(node);
                                diagram.alert(true);
                            });
                        }
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
                    node.alarming = false;
                    // only switch the node render if the node is neither alarming nor alerting
                    var selected = node.render.normal_selected();
                    var unselected = node.render.normal_unselected();
                    if (selected != node.image.selected || unselected != node.image.unselected) {
                        node.image.selected = selected;
                        node.image.unselected = unselected;
                        model.nodes.update(node);
                        var matches = diagrams.have_all([node.id]);
                        // console.log(matches);
                        matches.forEach(function(diagram) {
                            diagram.nodes.update(node);
                            diagram.alert(false);
                        });
                    }
                }
            });
        };

        alarms.add_callback(updateAlarmState);
    });