/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/events", "app/ui/diagrams"],
    function($, _, model, event_alerts, diagrams) {

        const updateAlertHandler = node => {
            const selected = node.degraded ? node.render.degrated_selected()
                : node.render.alert_selected();
            const unselected = node.degraded ? node.render.degrated_unselected()
                : node.render.alert_unselected();

            if (selected != node.image.selected || unselected != node.image.unselected) {
                node.image.selected = selected;
                node.image.unselected = unselected;
                model.nodes.update(node);

                const matches = diagrams.have_all([node.id]);

                for (let diagram of matches) {
                    diagram.nodes.update(node);
                    diagram.alert(true);
                }
            }
        };

        const updateEventAlertState = (current_alerts, previous_alerts) => {
            // iterate through current 'set' alerts
            const alerting_nodes = [];
            const inactive_nodes = [];
            const degraded_nodes = [];

            for (let item of current_alerts) {

                const node = model.nodes.get(item.resource_arn);

                if (node) {
                    node.alerting = true;
                    // node.degraded =  true;
                    node.degraded = _.has(item, "detail") && _.has(item.detail, "degraded")
                        ? item.detail.degraded : false;

                    if (node.degraded) {
                        degraded_nodes.push(item.resource_arn);
                    }

                    // track which nodes are signaling an alert
                    if (!alerting_nodes.includes(item.resource_arn)) {
                        alerting_nodes.push(item.resource_arn);
                        // console.log("setting alert color for " + node.id);
                        updateAlertHandler(node);
                    }
                }
            }

            // calculate the current alerts not included in the previous alerts
            for (let previous of previous_alerts) {
                let found = false;

                for (let arn of alerting_nodes) {
                    found = found || arn == previous.resource_arn;
                    if (found) {
                        break;
                    }
                }

                if (!found) {
                    inactive_nodes.push(previous.resource_arn);
                }
            }

            // 'unalert' the nodes that are no longer alerting
            for (let arn of inactive_nodes) {
                const node = model.nodes.get(arn);

                if (node) {
                    node.alerting = false;
                    node.degraded = _.includes(degraded_nodes, arn);

                    updateAlertHandler(node);
                }
            }
        };

        event_alerts.add_callback(updateEventAlertState);
    });