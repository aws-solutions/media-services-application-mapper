/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["lodash", "jquery", "app/model", "app/ui/global_view", "app/ui/util", "app/alarms", "app/regions", "app/ui/layout", "app/ui/alert", "app/ui/diagrams", "app/ui/confirmation"],
    function(_, $, model, global_view, ui_util, alarms, regions_promise, layout, alert, diagrams, confirmation) {

        $("#nodes_remove_disconnected_button").on("click", () => {
            var remove_nodes = [];
            $.each(model.nodes.get(), (nodeIndex, node) => {
                var found = false;
                $.each(model.edges.get(), (edgeIndex, edge) => {
                    found = found || (edge.to == node.id || edge.from == node.id);
                });
                if (!found) {
                    remove_nodes.push(node);
                }
            });
            if (remove_nodes.length > 0) {
                model.nodes.remove(remove_nodes);
            }
        });

        $("#nodes_remove_connected_button").on("click", () => {
            var remove_nodes = [];
            $.each(model.nodes.get(), (nodeIndex, node) => {
                var found = false;
                $.each(model.edges.get(), (edgeIndex, edge) => {
                    found = found || (edge.to == node.id || edge.from == node.id);
                });
                if (found) {
                    remove_nodes.push(node);
                }
            });
            if (remove_nodes.length > 0) {
                model.nodes.remove(remove_nodes);
            }
        });

        $("#diagram_remove_selected").on("click", function(event) {
            var shown = diagrams.shown();
            var selected = shown.network.getSelectedNodes();
            if (Array.isArray(selected) && selected.length > 0) {
                var html = `Remove ${selected.length} node${(selected.length==1?"":"s")} from the diagram?`;
                confirmation.show(html, function() {
                    shown.nodes.remove(selected)
                    var message = `${selected.length} node${(selected.length==1?"":"s")} removed`;
                    alert.show(message);
                });
            }
        });

        $("#nodes_save_layout").on("click", function(event) {
            alert.show("Saving layout");
            var network = global_view.get_network();
            $.each(model.nodes.get(), function(index, node) {
                var positions = network.getPositions([node.id]);
                layout.save_node(view_name, node, positions[node.id].x, positions[node.id].y).then(function(response) {
                    // console.log("ok");
                }).catch(function(error) {
                    console.log(error);
                });
            });
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
            shown.network.selectNodes(connected);
            alert.show(connected.length + " selected");
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
            var shown = diagrams.shown();
            var selected = shown.network.getSelectedNodes();
            var connected = [];
            for (var node_id of selected) {
                if (!connected.includes(node_id)) {
                    connected.push(node_id);
                    get_upstream(shown.edges, node_id, connected);
                }
            }
            console.log(connected);
            global_view.get_network().selectNodes(connected);
            alert.show(connected.length + " selected");
        });

        var get_upstream = function(edges, node_id, connected_nodes) {
            // var node_ids = global_view.get_network().getConnectedNodes(node_id);
            var upstream_edges = edges.get({
                filter: function(item) {
                    return item.to === node_id;
                }
            });
            for (var edge of upstream_edges) {
                if (!connected_nodes.includes(edge.from)) {
                    connected_nodes.push(edge.from);
                    get_upstream(edges, edge.from, connected_nodes);
                }
            }
        };


    });