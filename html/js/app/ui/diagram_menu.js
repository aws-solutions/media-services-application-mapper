/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["lodash", "jquery", "app/model", "app/ui/global_view", "app/ui/util", "app/alarms", "app/regions", "app/ui/layout", "app/ui/alert", "app/ui/diagrams", "app/ui/confirmation"],
    function(_, $, model, global_view, ui_util, alarms, regions_promise, layout, alert, diagrams, confirmation) {

        var vary_multiplier = 8;

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
            if (shown) {
                var selected = shown.network.getSelectedNodes();
                if (Array.isArray(selected) && selected.length > 0) {
                    var html = `Remove ${selected.length} node${(selected.length==1?"":"s")} from the diagram?`;
                    confirmation.show(html, function() {
                        shown.nodes.remove(selected)
                        var message = `${selected.length} node${(selected.length==1?"":"s")} removed`;
                        alert.show(message);
                    });
                }
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

        $("#diagram_add_downstream").on("click", function(event) {
            add_downstream_nodes();
        });

        function add_downstream_nodes() {
            var shown = diagrams.shown();
            if (shown) {
                var selected = shown.network.getSelectedNodes();
                var connected = [];
                for (var node_id of selected) {
                    if (!connected.includes(node_id)) {
                        connected.push(node_id);
                        ui_util.get_downstream(model.edges, node_id, connected);
                    }
                }
                // only add nodes not yet on the diagram
                var add_nodes = _.difference(connected.sort(), shown.nodes.getIds().sort());
                // use _.compact to remove nulls if id not found
                var nodes = _.compact(model.nodes.get(add_nodes));
                var view = shown.network.getViewPosition();
                shown.nodes.update(nodes);
                Array.from(nodes).forEach(function(node) {
                    shown.network.moveNode(node.id, ui_util.vary(view.x, node.size * vary_multiplier), ui_util.vary(view.y, node.size * vary_multiplier));
                });
                var node_ids = _.map(Array.from(nodes), "id");
                layout.save_layout(shown, node_ids);
                shown.network.fit();
            }
        };

        $("#diagram_add_upstream").on("click", function(event) {
            add_upstream_nodes();
        });

        function add_upstream_nodes() {
            var shown = diagrams.shown();
            if (shown) {
                var selected = shown.network.getSelectedNodes();
                var connected = [];
                for (var node_id of selected) {
                    if (!connected.includes(node_id)) {
                        connected.push(node_id);
                        ui_util.get_upstream(model.edges, node_id, connected);
                    }
                }
                // only add nodes not yet on the diagram
                var add_nodes = _.difference(connected.sort(), shown.nodes.getIds().sort());
                // use _.compact to remove nulls if id not found
                var nodes = _.compact(model.nodes.get(add_nodes));
                var view = shown.network.getViewPosition();
                shown.nodes.update(nodes);
                Array.from(nodes).forEach(function(node) {
                    shown.network.moveNode(node.id, ui_util.vary(view.x, node.size * vary_multiplier), ui_util.vary(view.y, node.size * vary_multiplier));
                });
                var node_ids = _.map(Array.from(nodes), "id");
                layout.save_layout(shown, node_ids);
                shown.network.fit();
            }
        };

        $("#diagram_add_all_nodes").on("click", function(event) {
            add_downstream_nodes();
            add_upstream_nodes();
        });

        var set_create_diagram_alert = function(message) {
            var html = `<div id="create_diagram_dialog_alert" class="alert alert-danger" role="alert">${message}</div>`;
            $("#create_diagram_dialog_alert").replaceWith(html);
        };

        var clear_create_diagram_alert = function() {
            var html = `<div id="create_diagram_dialog_alert"></div>`;
            $("#create_diagram_dialog_alert").replaceWith(html);
        };

        $("#create_diagram_dialog").on('shown.bs.modal', function() {
            clear_create_diagram_alert();
            $("#create_diagram_dialog_name").val("");
            $("#create_diagram_dialog_name").focus();
        });

        $("#create_diagram_dialog_proceed").on("click", function() {
            try {
                // get the name
                var name = $("#create_diagram_dialog_name").val();
                // check it
                var valid_name = new RegExp("^\\w+");
                if (valid_name.test(name)) {
                    // create a new diagram
                    var d = diagrams.add(name, _.snakeCase(name), true);
                    alert.show("Diagram created");
                    // hide the dialog
                    $("#create_diagram_dialog").modal('hide');
                    // select the new tab
                    d.show();
                } else {
                    set_create_diagram_alert("Names must start with an alphanumeric character");
                }
            } catch (error) {
                console.log(error);
                set_create_diagram_alert("Names must start with an alphanumeric character");
            }
        });

        var set_dupe_diagram_alert = function(message) {
            var html = `<div id="dupe_diagram_dialog_alert" class="alert alert-danger" role="alert">${message}</div>`;
            $("#dupe_diagram_dialog_alert").replaceWith(html);
        };

        var clear_dupe_diagram_alert = function() {
            var html = `<div id="dupe_diagram_dialog_alert"></div>`;
            $("#dupe_diagram_dialog_alert").replaceWith(html);
        };

        $("#dupe_diagram_dialog").on('shown.bs.modal', function() {
            clear_dupe_diagram_alert();
            $("#dupe_diagram_dialog_name").val("");
            $("#dupe_diagram_dialog_name").focus();
        });

        $("#dupe_diagram_dialog_proceed").on("click", function() {
            var current_diagram = diagrams.shown();
            if (current_diagram) {
                try {
                    // get the name
                    var name = $("#dupe_diagram_dialog_name").val();
                    // check it
                    var valid_name = new RegExp("^\\w+");
                    if (valid_name.test(name)) {
                        // create a new diagram
                        var new_diagram = diagrams.add(name, _.snakeCase(name), true);
                        new_diagram.nodes.update(current_diagram.nodes.get());
                        var positions = current_diagram.network.getPositions();
                        for (var key of Object.keys(positions)) {
                            new_diagram.network.moveNode(key, positions[key].x, positions[key].y);
                        }
                        layout.save_layout(new_diagram);
                        alert.show("Diagram duplicated");
                        // hide the dialog
                        $("#dupe_diagram_dialog").modal('hide');
                        // select the new tab
                        new_diagram.show();
                    } else {
                        set_dupe_diagram_alert("Names must start with an alphanumeric character");
                    }
                } catch (error) {
                    console.log(error);
                    set_dupe_diagram_alert("Names must start with an alphanumeric character");
                }
            }
        });

        $("#add-diagram-tab,#diagram_add_diagram").on("click", function() {
            $("#create_diagram_dialog").modal('show');
        });

        $("#duplicate-diagram-tab,#diagram_duplicate_diagram").on("click", function() {
            $("#dupe_diagram_dialog").modal('show');
        });

        $("#remove-diagram-tab,#diagram_remove_diagram").on("click", function() {
            var diagram = diagrams.shown();
            if (diagram) {
                var html = `Permanently remove ${diagram.name} diagram?`;
                confirmation.show(html, function() {
                    diagram.nodes.remove(diagram.nodes.getIds());
                    diagrams.remove(diagram.name);
                    var message = `${diagram.name} removed`;
                    alert.show(message);
                });
            }
        });

    });