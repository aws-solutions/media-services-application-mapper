/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as alarms from "../alarms.js";
import * as diagrams from "./diagrams.js";

function get_alarming_nodes(current_alarming_subscribers) {
    const alarming_nodes = [];
    for (const subscriber of current_alarming_subscribers) {
        const node = model.nodes.get(subscriber.ResourceArn);
        if (!node) {
            continue;
        }
        node.alarming = true;
        // track which nodes are signaling an alert
        if (!alarming_nodes.includes(subscriber.ResourceArn)) {
            alarming_nodes.push(subscriber.ResourceArn);
            const selected = node.render.alert_selected();
            const unselected = node.render.alert_unselected();
            // only update the node if the SVG changes
            if (
                selected != node.image.selected ||
                unselected != node.image.unselected
            ) {
                node.image.selected = selected;
                node.image.unselected = unselected;
                model.nodes.update(node);
                const matches = diagrams.have_all([node.id]);
                for (const diagram of matches) {
                    diagram.nodes.update(node);
                    diagram.alert(true);
                }
            }
        }
    }
    return alarming_nodes;
}

function get_inactive_nodes(previous_alarming_subscribers, alarming_nodes) {
    const inactive_nodes = [];
    for (const subscriber of previous_alarming_subscribers) {
        let found = false;
        for (const node_id of alarming_nodes) {
            found = found || node_id == subscriber.ResourceArn;
        }
        if (!found) {
            inactive_nodes.push(subscriber.ResourceArn);
        }
    }
    return inactive_nodes;
}

const updateAlarmState = function (
    current_alarming_subscribers,
    previous_alarming_subscribers
) {
    // iterate through current 'set' alerts
    const alarming_nodes = get_alarming_nodes(current_alarming_subscribers);

    // calculate the current alerts not included in the previous alerts
    const inactive_nodes = get_inactive_nodes(previous_alarming_subscribers, alarming_nodes);

    // 'unalert' the nodes that are no longer alerting
    for (const node_id of inactive_nodes) {
        const node = model.nodes.get(node_id);
        if (node) {
            node.alarming = false;
            // only switch the node render if the node is neither alarming nor alerting
            const selected = node.render.normal_selected();
            const unselected = node.render.normal_unselected();
            if (
                selected != node.image.selected ||
                unselected != node.image.unselected
            ) {
                node.image.selected = selected;
                node.image.unselected = unselected;
                model.nodes.update(node);
                const matches = diagrams.have_all([node.id]);
                for (const diagram of matches) {
                    diagram.nodes.update(node);
                    diagram.alert(false);
                }
            }
        }
    }
};

alarms.add_callback(updateAlarmState);
