/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["lodash", "jquery", "app/ui/util", "app/ui/layout", "app/ui/alert", "app/ui/diagrams"],
    function(_, $, ui_util, layout, alert, diagrams) {

        var selected_alarm_arn = [];

        var view_name = "global";

        $("#nodes_layout_vertical").on("click", function(event) {
            // global_view.vertical_layout();
            var shown = diagrams.shown();
            if (shown) {
                shown.layout_vertical(true);
            }
        });

        $("#nodes_layout_horizontal").on("click", function(event) {
            // global_view.horizontal_layout();
            var shown = diagrams.shown();
            if (shown) {
                shown.layout_horizontal(true);
            }
        });

        $("#nodes_layout_isolated").on("click", function(event) {
            // global_view.isolated_item_layout();
            var shown = diagrams.shown();
            if (shown) {
                shown.layout_isolated(true);
            }
        });

        $("#nodes_select_downstream").on("click", function(event) {
            var shown = diagrams.shown();
            if (shown) {
                var selected = shown.network.getSelectedNodes();
                var connected = [];
                for (var node_id of selected) {
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

        $("#nodes_select_upstream").on("click", function(event) {
            var shown = diagrams.shown();
            if (shown) {
                var selected = shown.network.getSelectedNodes();
                var connected = [];
                for (var node_id of selected) {
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

        $("#nodes_align_vertical").on("click", function(event) {
            var diagram = diagrams.shown();
            if (diagram) {
                var selected = diagram.network.getSelectedNodes();
                var positions = diagram.network.getPositions(selected);
                var average_x = 0;
                for (var node_id of Object.keys(positions)) {
                    average_x += positions[node_id].x;
                }
                average_x = Math.round(average_x / selected.length);
                for (var node_id of Object.keys(positions)) {
                    diagram.network.moveNode(node_id, average_x, positions[node_id].y);
                }
                layout.save_layout(diagram, Object.keys(positions));
                alert.show("Alignment complete");
            }
        });

        $("#nodes_align_horizontal").on("click", function(event) {
            var diagram = diagrams.shown();
            if (diagram) {
                var selected = diagram.network.getSelectedNodes();
                var positions = diagram.network.getPositions(selected);
                var average_y = 0;
                for (var node_id of Object.keys(positions)) {
                    average_y += positions[node_id].y;
                }
                average_y = Math.round(average_y / selected.length);
                for (var node_id of Object.keys(positions)) {
                    diagram.network.moveNode(node_id, positions[node_id].x, average_y);
                }
                layout.save_layout(diagram, Object.keys(positions));
                alert.show("Alignment complete");
            }
        });

    });