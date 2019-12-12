/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "app/ui/global_view", "app/channels", "app/ui/tile_view", "app/ui/util", "app/ui/diagrams"],
    function($, model, global_view, channels, tile_view, ui_util, diagrams) {

        var tab_id = "nav-data-tab";
        var div_id = "nav-data";

        var blinks = 10;

        var show = function() {
            $("#" + tab_id).tab("show");
        };

        var display_selected_nodes = function(diagram, node_ids) {
            nodes_ids = (Array.isArray(node_ids) ? node_ids : [node_ids]);
            var node = model.nodes.get(node_ids[0]);
            var found_on = diagrams.have_all(node.id);
            var diagram_links = "";
            var diagram_link_ids = [];
            for (var diagram of found_on) {
                var id = ui_util.makeid();
                var html = `<a href="#" data-diagram-name="${diagram.name}" draggable="true" id="${id}">${diagram.name}</a>&nbsp;&nbsp;&nbsp;&nbsp;`;
                diagram_link_ids.push({
                    id: id,
                    node_id: node.id,
                    diagram: diagram
                });
                diagram_links += html;
            }
            var diagram_html = `<p class="card-text small text-muted mb-0 pb-0"><b>Diagrams:</b>&nbsp;&nbsp;${diagram_links}</p>`;
            channels.arn_to_channels(node.id).then(function(tile_names) {
                var channel_tile_link_ids = [];
                var tile_html = "";
                if (tile_names.length > 0) {
                    var tile_links = "";
                    for (var name of tile_names) {
                        var id = ui_util.makeid();
                        channel_tile_link_ids.push({
                            id: id,
                            name: name
                        });
                        var html = `<a href="#" data-tile-name="${name}" draggable="true" id="${id}">${name}</a>&nbsp;&nbsp;&nbsp;&nbsp;`;
                        tile_links = tile_links + html;
                    }
                    tile_html = `<p class="card-text small text-muted mb-0 pb-0"><b>Tiles:</b>&nbsp;&nbsp;${tile_links}</p>`;
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
                renderjson.set_icons("+", "-");
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
                var json = renderjson(data);
                $("#" + div_id + "-text")[0].appendChild(
                    json
                );
                // attach click handlers to tile links
                for (var link of channel_tile_link_ids) {
                    var name = link.name;
                    var id = link.id;
                    var view = tile_view;
                    var eventClosure = function() {
                        return function(event) {
                            var tab = $("#channel-tiles-tab");
                            if (tab.attr("aria-selected") == "false") {
                                $("#channel-tiles-tab").tab("show");
                            }
                            view.blink(name);
                        };
                    }();
                    $("#" + id).on("click", eventClosure);
                }
                // attach click handlers to diagram links
                for (var item of diagram_link_ids) {
                    var my_diagram = item.diagram;
                    var id = item.id;
                    var node_id = item.node_id;
                    var eventClosure = function() {
                        return function(event) {
                            my_diagram.network.once("afterDrawing", (function() {
                                return function() {
                                    my_diagram.network.fit({
                                        nodes: [node_id],
                                        animation: true
                                    });
                                    my_diagram.blink(blinks, node_id);
                                };
                            })());
                            my_diagram.show();
                        };
                    }();
                    $("#" + id).on("click", eventClosure);
                }
            });
            // });
        };


        var display_selected_edges = function(diagram, edges) {
            var edge = model.edges.get(edges[0]);
            var toNode = model.nodes.get(edge.to);
            var fromNode = model.nodes.get(edge.from);
            $("#" + div_id).empty();
            renderjson.set_icons("+", "-");
            renderjson.set_show_to_level(1);
            var html = `
                <h6 class="card-subtitle mb-2 text-muted">Connection from ${fromNode.title} to ${toNode.title}</h6>
                <p class="card-text small" id="${div_id}-data"></p>
                <h6 class="card-subtitle mb-2 text-muted">From</h6>
                <p class="card-text small" id="${div_id}-from"></p>
                <h6 class="card-subtitle mb-2 text-muted">To</h6>
                <p class="card-text small" id="${div_id}-to"></p>
                `;
            $("#" + div_id).append(html);
            $("#" + div_id + "-data").append(renderjson(edge.data));
            $("#" + div_id + "-from").append(renderjson(fromNode.data));
            $("#" + div_id + "-to").append(renderjson(toNode.data));
        };


        var display_selected_tile = function(name, members) {
            renderjson.set_icons("+", "-");
            renderjson.set_show_to_level(2);
            var data = [];
            var missing = [];
            for (var member_value of members) {
                var node = model.nodes.get(member_value.id);
                if (node) {
                    data.push(node.data);
                } else {
                    missing.push(member_value.id);
                }
            }
            data.push({ "missing-nodes": missing });
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
        };

        var tile_view_listener = function(name, members) {
            var selected = tile_view.selected();
            if (selected === name) {
                // show();
                display_selected_tile(name, members);
            } else if (selected) {
                channels.retrieve_channel(selected).then((members) => {
                    display_selected_tile(selected, members);
                });
            }
        };

        diagrams.add_selection_callback(function(diagram, event) {
            // console.log(event);
            if (event.nodes.length > 0) {
                display_selected_nodes(diagram, event.nodes);
            } else
            if (event.edges.length > 0) {
                display_selected_edges(diagram, event.edges);
            }
        });

        tile_view.add_selection_callback(tile_view_listener);

        // return {
        //     "display_selected_tile": display_selected_tile,
        //     "display_selected_nodes": display_selected_nodes,
        //     "display_selected_edge": display_selected_edge,
        //     "show": show
        // }
    });