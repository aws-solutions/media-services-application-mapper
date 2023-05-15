/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as overlays from "./overlays/overlays.js";
import * as diagrams from "./diagrams.js";

let intervalID;
// interval in millis to update the cache
const update_interval = 5000;

function handle_node(node) {
    let selected = node.render.normal_selected();
    let unselected = node.render.normal_unselected();

    if (node.degraded) {
        selected = node.render.degraded_selected();
        unselected = node.render.degraded_unselected();
    } else if (node.alerting || node.alarming) {
        selected = node.render.alert_selected();
        unselected = node.render.alert_unselected();
    }

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
        }
    }
}

const update_overlay = function () {
    // console.log("info overlay update");
    // get all the overlays
    for (const ov of overlays.all) {
        if (!ov.informational) {
            continue;
        }
        const nodes = model.nodes.get({
            filter: (item) => {
                return (
                    ov.match_type == (item.generic_node_type || item.title)
                );
            },
        });

        for (const node of nodes) {
            handle_node(node);
        }
    }
};

const schedule_interval = function () {
    if (intervalID) {
        clearInterval(intervalID);
    }
    intervalID = setInterval(update_overlay, update_interval);
    console.log(
        "informational overlays: interval scheduled " +
            update_interval +
            "ms, intervalID = " +
            intervalID
    );
};

schedule_interval();
