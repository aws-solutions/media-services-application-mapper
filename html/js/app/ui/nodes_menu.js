/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "app/ui/global_view", "app/ui/util", "app/alarms", "app/regions", "app/ui/layout", "app/ui/alert"],
    function($, model, global_view, ui_util, alarms, regions_promise, layout, alert) {

        var selected_alarm_arn = [];

        var view_name = "global";

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

        $("#nodes_associate_alarms_button").on("click", function(event) {
            var nodes = global_view.get_selected().nodes;
            console.log("associate alarms to " + JSON.stringify(nodes));
        });

        $("#associate_alarm_modal").on("show.bs.modal", function(event) {
            var selected = global_view.get_selected().nodes;
            var node = model.nodes.get(selected[0]);
            $("#associate_alarm_name").html(node.header);
            // populate the dialog with the selected items when it is shown
            console.log("channel modal show");
            // initially disable save button
            $("#save_associate_alarm").addClass("disabled");
            $("#save_associate_alarm").attr("aria-disabled", true);
            // empty the body compartment
            $("#associate_alarm_tbody").empty();
            var promises = [];
            regions_promise().then(function(regions) {
                $.each(regions.get_selected(), function(region_index, region_name) {
                    alarms.retrieve_by_region(region_name).then(function(region_alarms) {
                        $.each(region_alarms, function(alarm_index, alarm_item) {
                            var check_id = ui_util.makeid();
                            var html = `
                                <tr>
                                    <td><input type="checkbox" id="${check_id}"></td>
                                    <td>${alarm_item.AlarmName}</td>
                                    <td>${alarm_item.StateValue}</td>
                                    <td>${alarm_item.MetricName}</td>
                                </tr>`;
                            $("#associate_alarm_tbody").append(html);
                            $("#" + check_id).on("change", (function() {
                                var local_alarm_item = alarm_item;
                                return function(event) {
                                    if (event.target.checked) {
                                        if (!selected_alarm_arn.indexOf(local_alarm_item.AlarmArn)) {
                                            selected_alarm_arn.push(local_alarm_item.AlarmArn);
                                        }
                                    } else {
                                        var index = selected_alarm_arn.indexOf(local_alarm_item.AlarmArn);
                                        if (index == 0) {
                                            selected_alarm_arn.shift(local_alarm_item.AlarmArn);
                                        } else if (index == selected_alarm_arn.length - 1) {
                                            selected_alarm_arn.pop(local_alarm_item.AlarmArn);
                                        } else if (index > 0) {
                                            var updated = selected_alarm_arn.slice(0, index).concat(selected_alarm_arn.slice(index + 1));
                                            selected_alarm_arn = updated;
                                        }
                                    }
                                }
                            })());
                        });
                    }).catch(function(error) {
                        console.log(error);
                    });
                });
            }).catch(function(error) {
                console.log(error);
            });
        });

        $("#associate_alarm_modal").on("hide.bs.modal", function(event) {
            console.log("channel modal hide");
            console.log("selected alarms = " + JSON.stringify(selected_alarm_arn));
        });

        $("#nodes_layout_vertical").on("click", function(event) {
            global_view.vertical_layout();
        });

        $("#nodes_layout_horizontal").on("click", function(event) {
            global_view.horizontal_layout();
        });

        $("#nodes_layout_isolated").on("click", function(event) {
            global_view.isolated_item_layout();
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
            var selected = global_view.get_selected().nodes;
            var connected = [];
            for (var node_id of selected) {
                if (!connected.includes(node_id)) {
                    connected.push(node_id);
                    get_downstream(node_id, connected);
                }
            }
            console.log(connected);
            alert.show(connected.length + " selected");
            global_view.get_network().selectNodes(connected);
        });

        var get_downstream = function(node_id, connected_nodes) {
            // var node_ids = global_view.get_network().getConnectedNodes(node_id);
            var downstream_edges = model.edges.get({
                filter: function(item) {
                    return item.from === node_id;
                }
            });
            for (var edge of downstream_edges) {
                if (!connected_nodes.includes(edge.to)) {
                    connected_nodes.push(edge.to);
                    get_downstream(edge.to, connected_nodes);
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