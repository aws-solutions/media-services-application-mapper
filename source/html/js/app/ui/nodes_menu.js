/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as ui_util from "./util.js";
import * as layout from "./layout.js";
import * as alert from "./alert.js";
import * as diagrams from "./diagrams.js";

$("#nodes_layout_vertical").on("click", function () {
    let shown = diagrams.shown();
    if (shown) {
        shown.layout_vertical(true);
    }
});

$("#nodes_layout_horizontal").on("click", function () {
    let shown = diagrams.shown();
    if (shown) {
        shown.layout_horizontal(true);
    }
});

$("#nodes_layout_isolated").on("click", function () {
    let shown = diagrams.shown();
    if (shown) {
        shown.layout_isolated(true);
    }
});

$("#nodes_select_downstream").on("click", function () {
    let shown = diagrams.shown();
    if (shown) {
        let selected = shown.network.getSelectedNodes();
        let connected = [];
        for (let node_id of selected) {
            if (!connected.includes(node_id)) {
                connected.push(node_id);
                ui_util.get_downstream(shown.edges, node_id, connected);
            }
        }
        console.log(connected);
        alert.show(connected.length + " selected");
        shown.network.selectNodes(connected);
    }
});

$("#nodes_select_upstream").on("click", function () {
    let shown = diagrams.shown();
    if (shown) {
        let selected = shown.network.getSelectedNodes();
        let connected = [];
        for (let node_id of selected) {
            if (!connected.includes(node_id)) {
                connected.push(node_id);
                ui_util.get_upstream(shown.edges, node_id, connected);
            }
        }
        console.log(connected);
        alert.show(connected.length + " selected");
        shown.network.selectNodes(connected);
    }
});

$("#nodes_align_vertical").on("click", function () {
    let diagram = diagrams.shown();
    if (diagram) {
        let selected = diagram.network.getSelectedNodes();
        let positions = diagram.network.getPositions(selected);
        let average_x = 0;
        for (let node_id of Object.keys(positions)) {
            average_x += positions[node_id].x;
        }
        average_x = Math.round(average_x / selected.length);
        for (let node_id of Object.keys(positions)) {
            diagram.network.moveNode(node_id, average_x, positions[node_id].y);
        }
        layout.save_layout(diagram, Object.keys(positions));
        alert.show("Alignment complete");
    }
});

$("#nodes_align_horizontal").on("click", function () {
    let diagram = diagrams.shown();
    if (diagram) {
        let selected = diagram.network.getSelectedNodes();
        let positions = diagram.network.getPositions(selected);
        let average_y = 0;
        for (let node_id of Object.keys(positions)) {
            average_y += positions[node_id].y;
        }
        average_y = Math.round(average_y / selected.length);
        for (let node_id of Object.keys(positions)) {
            diagram.network.moveNode(node_id, positions[node_id].x, average_y);
        }
        layout.save_layout(diagram, Object.keys(positions));
        alert.show("Alignment complete");
    }
});
