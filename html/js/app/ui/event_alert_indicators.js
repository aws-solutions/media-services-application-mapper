/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/events"], function($, _, model, event_alerts) {

    var updateEventAlertState = function(current_alerts, previous_alerts) {
        // iterate through current 'set' alerts
        var alerting_nodes = [];
        var inactive_nodes = [];
        $.each(current_alerts, function(index, item) {
            var node = model.nodes.get(item.resource_arn);
            if (node) {
                // track which nodes are signaling an alert
                if (!alerting_nodes.includes(item.resource_arn)) {
                    alerting_nodes.push(item.resource_arn);
                    // console.log("setting alert color for " + node.id);
                    node.image.selected = node.render.alert_selected();
                    node.image.unselected = node.render.alert_unselected();
                    model.nodes.update(node);
                }
            }
        });

        // calculate the current alerts not included in the previous alerts
        previous_alerts.forEach(function(previous) {
            var found = false;
            alerting_nodes.forEach(function(arn) {
                found = found || arn == previous.resource_arn;
            });
            if (!found) {
                inactive_nodes.push(previous.resource_arn);
            }
        });

        // 'unalert' the nodes that are no longer alerting
        $.each(inactive_nodes, function(index, arn) {
            var node = model.nodes.get(arn);
            if (node) {
                node.image.selected = node.render.normal_selected();
                node.image.unselected = node.render.normal_unselected();
                model.nodes.update(node);
            }
        });
    };

    event_alerts.add_listener(updateEventAlertState);
});