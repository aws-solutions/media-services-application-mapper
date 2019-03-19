/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["lodash", "jquery", "app/model", "app/ui/global_view", "app/ui/util", "app/alarms", "app/regions", "app/ui/layout", "app/ui/alert", "app/ui/diagrams", "app/ui/confirmation"],
    function(_, $, model, global_view, ui_util, alarms, regions_promise, layout, alert, diagrams, confirmation) {

        var selected_alarm_arn = [];

        var view_name = "global";

        $("#channel-tiles-tab").on("show.bs.tab", function(event) {
            $("#nodes_dropdown").addClass("disabled");
            $("#nodes_dropdown").attr("aria-disabled", true);
        });

        $("#global-model-tab").on("show.bs.tab", function(event) {
            $("#nodes_dropdown").removeClass("disabled");
            $("#nodes_dropdown").attr("aria-disabled", false);
        });

        $("#nodes_dropdown").on("click", function(event) {
            if (global_view.get_selected().nodes.length == 0) {
                $("#nodes_associate_alarms_button").addClass("disabled");
                $("#nodes_associate_alarms_button").attr("aria-disabled", true);
            } else {
                $("#nodes_associate_alarms_button").removeClass("disabled");
                $("#nodes_associate_alarms_button").attr("aria-disabled", false);
            }
        });

        $("#nodes_layout_vertical").on("click", function(event) {
            // global_view.vertical_layout();
            var shown = diagrams.shown();
            shown.layout_vertical();
        });

        $("#nodes_layout_horizontal").on("click", function(event) {
            // global_view.horizontal_layout();
            var shown = diagrams.shown();
            shown.layout_horizontal();
        });

        $("#nodes_layout_isolated").on("click", function(event) {
            // global_view.isolated_item_layout();
            var shown = diagrams.shown();
            shown.layout_isolated();
        });

        $("#nodes_select_downstream").on("click", function(event) {
            var shown = diagrams.shown();
            var selected = shown.network.getSelectedNodes();
            var connected = [];
            for (var node_id of selected) {
                if (!connected.includes(node_id)) {
                    connected.push(node_id);
                    get_downstream(shown.edges, node_id, connected);
                }
            }
            console.log(connected);
            alert.show(connected.length + " selected");
            shown.network.selectNodes(connected);
        });

        var get_downstream = function(edges, node_id, connected_nodes) {
            // var node_ids = global_view.get_network().getConnectedNodes(node_id);
            var downstream_edges = edges.get({
                filter: function(item) {
                    return item.from === node_id;
                }
            });
            for (var edge of downstream_edges) {
                if (!connected_nodes.includes(edge.to)) {
                    connected_nodes.push(edge.to);
                    get_downstream(edges, edge.to, connected_nodes);
                }
            }
        };

        $("#nodes_select_upstream").on("click", function(event) {
            var selected = global_view.get_selected().nodes;
            var connected = [];
            for (var node_id of selected) {
                if (!connected.includes(node_id)) {
                    connected.push(node_id);
                    get_upstream(node_id, connected);
                }
            }
            console.log(connected);
            alert.show(connected.length + " selected");
            global_view.get_network().selectNodes(connected);
        });

        var get_upstream = function(node_id, connected_nodes) {
            // var node_ids = global_view.get_network().getConnectedNodes(node_id);
            var upstream_edges = model.edges.get({
                filter: function(item) {
                    return item.to === node_id;
                }
            });
            for (var edge of upstream_edges) {
                if (!connected_nodes.includes(edge.from)) {
                    connected_nodes.push(edge.from);
                    get_upstream(edge.from, connected_nodes);
                }
            }
        };

        $("#nodes_align_vertical").on("click", function(event) {
            var selected = global_view.get_selected().nodes;
            var positions = global_view.get_network().getPositions(selected);
            var average_x = 0;
            for (var node_id of Object.keys(positions)) {
                average_x += positions[node_id].x;
            }
            average_x = Math.round(average_x / selected.length);
            for (var node_id of Object.keys(positions)) {
                global_view.get_network().moveNode(node_id, average_x, positions[node_id].y);
                layout.save_node("global", node_id, average_x, positions[node_id].y);
            }
            alert.show("Alignment complete");
        });

        $("#nodes_align_horizontal").on("click", function(event) {
            var selected = global_view.get_selected().nodes;
            var positions = global_view.get_network().getPositions(selected);
            var average_y = 0;
            for (var node_id of Object.keys(positions)) {
                average_y += positions[node_id].y;
            }
            average_y = Math.round(average_y / selected.length);
            for (var node_id of Object.keys(positions)) {
                global_view.get_network().moveNode(node_id, positions[node_id].x, average_y);
                layout.save_node("global", node_id, positions[node_id].x, average_y);
            }
            alert.show("Alignment complete");
        });

    });