/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/events", "app/ui/diagrams"],
    function($, _, model, event_alerts, diagrams) {

        const updateAlertHandler = (node, alertState = true) => {
            let selected = null;
            let unselected = null;

            if (node.degraded) {
                selected = node.render.degraded_selected();
                unselected = node.render.degraded_unselected();
            } else if (node.alerting) {
                selected = node.render.alert_selected();
                unselected = node.render.alert_unselected();
            } else {
                selected = node.render.normal_selected();
                unselected = node.render.normal_unselected();
            }

            if (selected != node.image.selected || unselected != node.image.unselected) {
                node.image.selected = selected;
                node.image.unselected = unselected;
                model.nodes.update(node);

                const matches = diagrams.have_all([node.id]);

                for (let diagram of matches) {
                    diagram.nodes.update(node);
                    diagram.alert(alertState);
                }
            }
        };

        const updateEventAlertState = (current_alerts, previous_alerts) => {
            /** iterate through current 'set' alerts */
            const alerting_nodes = [];
            const inactive_nodes = [];
            const degraded_nodes = [];

            for (let item of current_alerts) {
                const node = model.nodes.get(item.resource_arn);

                if (node) {
                    node.alerting = true;
                    node.degraded = _.has(item, "detail") && _.has(item.detail, "degraded") ?
                        item.detail.degraded : false;

                    if (node.degraded) {
                        if (!degraded_nodes.includes(item.resource_arn)) {
                            degraded_nodes.push(item.resource_arn);
                            updateAlertHandler(node);
                        }
                    } else {
                        /**
                         * if node is not degraded, we still need to check that the resource_arn
                         * is not included in the degraded_nodes array. If it is, that means
                         * the other pipeline is degraded, therefore we do not alert.
                         */
                        if (!alerting_nodes.includes(item.resource_arn) && !degraded_nodes.includes(item.resource_arn)) {
                            alerting_nodes.push(item.resource_arn);
                            updateAlertHandler(node);
                        }
                    }
                }
            }

            /** calculate the current alerts not included in the previous alerts */
            for (let previous of previous_alerts) {
                let found = false;

                for (let arn of alerting_nodes) {
                    found = found || arn === previous.resource_arn;
                    if (found) {
                        break;
                    }
                }

                if (!found) {
                    inactive_nodes.push(previous.resource_arn);
                }
            }

            /** 'unalert' the nodes that are no longer alerting */
            for (let arn of inactive_nodes) {
                const node = model.nodes.get(arn);

                if (node) {
                    node.alerting = false;
                    node.degraded = _.includes(degraded_nodes, arn);

                    updateAlertHandler(node, false);
                }
            }
        };

        event_alerts.add_callback(updateEventAlertState);
    });