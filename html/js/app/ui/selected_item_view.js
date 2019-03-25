/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "app/ui/global_view", "app/channels", "app/ui/tile_view", "app/ui/util", "app/ui/diagrams"],
    function($, model, global_view, channels, tile_view, ui_util, diagrams) {

        var tab_id = "nav-data-tab";
        var div_id = "nav-data";

        var blinks = 10;

        var show = function() {
            $("#" + tab_id).tab('show');
        };

        var display_selected_nodes = function(diagram, node_ids) {
            var compartment = "";
            var promises = [];
            nodes_ids = Array.isArray(node_ids) ? node_ids : [node_ids];
            var node = model.nodes.get(node_ids[0]);
            var found_on = diagrams.have_all(node.id);
            var diagram_links = "";
            var diagram_link_ids = [];
            found_on.forEach(function(diagram) {
                var id = ui_util.makeid();
                var html = `<a href="#" data-diagram-name="${diagram.name}" draggable="true" id="${id}">${diagram.name}</a>&nbsp;&nbsp;&nbsp;&nbsp;`;
                diagram_link_ids.push({
                    id: id,
                    node_id: node.id,
                    diagram: diagram
                });
                diagram_links += html;
            });
            var diagram_html = `<p class="card-text small text-muted mb-0 pb-0"><b>Diagrams:</b>&nbsp;&nbsp;${diagram_links}</p>`;
            channels.arn_to_channels(node.id).then(function(tile_names) {
                var channel_tile_link_ids = [];
                var tile_html = "";
                if (tile_names.length > 0) {
                    var tile_links = "";
                    $.each(tile_names, function(index, name) {
                        var id = ui_util.makeid();
                        channel_tile_link_ids.push({
                            id: id,
                            name: name
                        });
                        var html = `<a href="#" data-tile-name="${name}" draggable="true" id="${id}">${name}</a>&nbsp;&nbsp;&nbsp;&nbsp;`;
                        tile_links = tile_links + html;
                    });
                    tile_html = `<p class="card-text small text-muted mb-0 pb-0"><b>Channel tiles:</b>&nbsp;&nbsp;${tile_links}</p>`;
                }
                var cache_html = "";
                if (node.cache_update != 0) {
                    var updated = new Date();
                    updated.setTime(Number.parseInt(node.cache_update) * 1000);
                    cache_html = `<p class="card-text small text-muted mt-0 pt-0"><b>Updated:</b> ${updated.toString()}</p>`;
                }
                var data = node.data;
                // $("#search_input").val("");
                // $("#nav-data-subtitle").html(node.title);
                renderjson.set_icons('+', '-');
                renderjson.set_show_to_level(1);
                var html = `
                    <h6 class="card-subtitle mb-2 text-muted" id="${div_id}-subtitle">${node.header}&nbsp;&nbsp;&nbsp;&nbsp;<small><a target="_blank" class="mb-2" href="${node.console_link()}">AWS Console</a>&nbsp;&nbsp;&nbsp;&nbsp;<a target="_blank" class="mb-2" href="${node.cloudwatch_link()}">AWS CloudWatch</a></small></h6>
                    ${tile_html}
                    ${diagram_html}
                    ${cache_html}
                    <p class="card-text small" id="${div_id}-text"></p>
                    `;
                // if (empty) {
                $("#" + div_id).empty();
                // }
                $("#" + div_id).append(html);
                $("#" + div_id + "-text")[0].appendChild(
                    renderjson(data)
                );
                // attach click handlers to channel tile links
                $.each(channel_tile_link_ids, function(index, link) {
                    var name = link.name;
                    var id = link.id;
                    var view = tile_view;
                    var eventClosure = function() {
                        return function(event) {
                            var tab = $("#channel-tiles-tab");
                            if (tab.attr("aria-selected") == "false") {
                                $("#channel-tiles-tab").tab('show');
                            }
                            view.blink(name);
                        };
                    }();
                    $("#" + id).on("click", eventClosure);
                });
                // attach click handlers to diagram links
                $.each(diagram_link_ids, function(index, item) {
                    var diagram = item.diagram;
                    var id = item.id;
                    var node_id = item.node_id;
                    var eventClosure = function() {
                        return function(event) {
                            diagram.network.once("afterDrawing", (function() {
                                return function() {
                                    diagram.network.fit({
                                        nodes: [node_id],
                                        animation: true
                                    });
                                    diagram.blink(blinks, node_id);
                                }
                            })());
                            diagram.show();
                        };
                    }();
                    $("#" + id).on("click", eventClosure);
                });
            });
            // });
        };


        var display_selected_edge = function(edge, empty) {
            var toNode = model.nodes.get(edge.to);
            var fromNode = model.nodes.get(edge.from);
            // $("#search_input").val("");
            $("#nav-data-subtitle").html("Connection from " + fromNode.title + " to " + toNode.title);
            renderjson.set_icons('+', '-');
            renderjson.set_show_to_level(1);
            if (empty) {
                $("#nav-data-text").empty();
            }
            $("#nav-data-text")[0].appendChild(
                renderjson(fromNode.data)
            );
            $("#nav-data-text")[0].appendChild(
                renderjson(toNode.data)
            );
        };


        var display_selected_tile = function(name, members) {
            renderjson.set_icons('+', '-');
            renderjson.set_show_to_level(2);
            var data = [];
            $.each(members, function(member_index, member_value) {
                data.push(model.nodes.get(member_value.id).data);
            });
            var html = `
            <h6 class="card-subtitle mb-2 text-muted" id="${div_id}-subtitle">Channel: ${name}</h6>
            <p class="card-text small" id="${div_id}-text"></p>
            `;
            $("#" + div_id).empty();
            $("#" + div_id).append(html);
            $("#" + div_id + "-text")[0].appendChild(
                renderjson(data)
            );
        };

        var display_no_selection = function() {
            $("#nav-data-text").empty();
            $("#nav-data-subtitle").empty();
            // $("#search_input").val("");
        }

        var global_view_listener = function(event) {
            if (event.nodes.length > 0) {
                // show();
                $.each(event.nodes, function(index, id) {
                    display_selected_node(model.nodes.get(id), (index == 0));
                });
                // zoom into the node on a double-[tap,click]
                if (event.event.type === "doubletap") {
                    global_view.fit([event.nodes[0]]);
                }
            } else if (event.edges.length > 0) {
                // show();
                $.each(event.edges, function(index, id) {
                    display_selected_edge(model.edges.get(id), (index == 0));
                });
            } else if (event.event.type === "doubletap" && event.nodes.length == 0 && event.edges.length == 0) {
                // get the vis canvas location of the doubletap
                var click_x = event.pointer.canvas.x;
                var click_y = event.pointer.canvas.y;
                var network = global_view.get_network();
                var closest = null;
                // get all the node locations
                var positions = network.getPositions();
                // find the node closest to the doubletap
                for (var p of Object.entries(positions)) {
                    if (closest == null) {
                        closest = {
                            id: p[0],
                            dx: Math.abs(click_x - p[1].x),
                            dy: Math.abs(click_y - p[1].y)
                        };
                    } else {
                        var dx = Math.abs(click_x - p[1].x);
                        var dy = Math.abs(click_y - p[1].y);
                        // update the closest node if better one is found
                        if (dx + dy < closest.dx + closest.dy) {
                            closest = {
                                id: p[0],
                                dx: dx,
                                dy: dy
                            };
                        }
                    }
                }
                console.log(JSON.stringify(closest));
                if (closest != null) {
                    // zoom to the closest node to the doubletap
                    global_view.fit([closest.id]);
                }
            }
        };

        var tile_view_listener = function(name, members) {
            if (tile_view.get_selected_tile_name() != "") {
                // show();
                display_selected_tile(name, members);
            } else {
                display_no_selection();
            }
        };

        diagrams.add_selection_callback(function(diagram, event) {
            if (event.nodes.length > 0) {
                display_selected_nodes(diagram, event.nodes);
            }
        });

        // return {
        //     "display_selected_tile": display_selected_tile,
        //     "display_selected_nodes": display_selected_nodes,
        //     "display_selected_edge": display_selected_edge,
        //     "show": show
        // }
    });