/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as channels from "../channels.js";
import * as tile_view from "./tile_view.js";
import * as ui_util from "./util.js";
import * as diagrams from "./diagrams.js";

var data_div_id = "nav-data";
var alerts_div_id = "nav-alerts";
var alarms_div_id = "nav-alarms";
var events_div_id = "nav-events";

var data_tab_id = "nav-data-tab";
var alerts_tab_id = "nav-alerts-tab";
var alarms_tab_id = "nav-alarms-tab";
var events_tab_id = "nav-events-tab";

const blinks = 10;

var display_selected_nodes = function (diagram, node_ids) {
    var node = model.nodes.get(node_ids[0]);
    var found_on = diagrams.have_all(node.id);
    // console.log(found_on);
    var diagram_links = "";
    var diagram_link_ids = [];
    for (let diagram of found_on) {
        var id = ui_util.makeid();
        var html = `<a href="#" data-diagram-name="${diagram.name}" draggable="true" id="${id}">${diagram.name}</a>&nbsp;&nbsp;&nbsp;&nbsp;`;
        diagram_link_ids.push({
            id: id,
            node_id: node.id,
            diagram: diagram,
        });
        diagram_links += html;
    }
    var diagram_html = `<p class="card-text small text-muted mb-0 pb-0"><b>Diagrams:</b>&nbsp;&nbsp;${diagram_links}</p>`;
    channels.arn_to_channels(node.id).then(function (tile_names) {
        var channel_tile_link_ids = [];
        var tile_html = "";
        if (tile_names.length > 0) {
            var tile_links = "";
            for (let name of tile_names) {
                let id = ui_util.makeid();
                channel_tile_link_ids.push({
                    id: id,
                    name: name,
                });
                let html = `<a href="#" data-tile-name="${name}" draggable="true" id="${id}">${name}</a>&nbsp;&nbsp;&nbsp;&nbsp;`;
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
        // console.log(data);
        // $("#search_input").val("");
        // $("#nav-data-subtitle").html(node.title);
        renderjson.set_icons("+", "-");
        renderjson.set_show_to_level(1);
        let html = `
                    <h6 class="card-subtitle mb-2 text-muted" id="${data_div_id}-subtitle">${
            node.header
        }&nbsp;&nbsp;&nbsp;&nbsp;<small><a target="_blank" class="mb-2" href="${node.console_link()}">AWS Console</a>&nbsp;&nbsp;&nbsp;&nbsp;<a target="_blank" class="mb-2" href="${node.cloudwatch_link()}">AWS CloudWatch</a></small></h6>
                    ${tile_html}
                    ${diagram_html}
                    ${cache_html}
                    <p class="card-text small" id="${data_div_id}-text"></p>
                    `;
        // if (empty) {
        $("#" + data_div_id).empty();
        // }
        $("#" + data_div_id).append(html);
        var json = renderjson(data);
        $("#" + data_div_id + "-text")[0].appendChild(json);
        // attach click handlers to tile links
        for (let link of channel_tile_link_ids) {
            let id = link.id;
            let eventClosure = (function (
                local_tile_view,
                local_link,
                local_jq
            ) {
                var local_view = local_tile_view;
                var local_name = local_link.name;
                return function () {
                    var tab = local_jq("#channel-tiles-tab");
                    if (tab.attr("aria-selected") == "false") {
                        local_jq("#channel-tiles-tab").tab("show");
                    }
                    local_view.blink(local_name);
                };
            })(tile_view, link, $);
            $("#" + id).on("click", eventClosure);
        }
        // attach click handlers to diagram links
        for (let item of diagram_link_ids) {
            let id = item.id;
            let eventClosure = (function (local_item) {
                var local_diagram = local_item.diagram;
                var local_node_id = local_item.node_id;
                var local_blinks = blinks;
                return function () {
                    local_diagram.network.once(
                        "afterDrawing",
                        (function () {
                            return function () {
                                local_diagram.network.fit({
                                    nodes: [local_node_id],
                                    animation: true,
                                });
                                local_diagram.blink(
                                    local_blinks,
                                    local_node_id
                                );
                            };
                        })()
                    );
                    local_diagram.show();
                };
            })(item);
            $("#" + id).on("click", eventClosure);
        }
    });
    // if node is managed instance, alerts and cloudwatch events don't apply
    // if medialive channel/multiplex or mediaconnect flow, alerts apply
    if (node_ids[0].includes("managed-instance")) {
        show_elements([data_div_id, alarms_div_id, data_tab_id, alarms_tab_id]);
        hide_elements([
            alerts_div_id,
            events_div_id,
            alerts_tab_id,
            events_tab_id,
        ]);
    } else if (
        (node_ids[0].includes("medialive") &&
            node_ids[0].includes("channel")) ||
        node_ids[0].includes("multiplex") ||
        node_ids[0].includes("mediaconnect")
    ) {
        show_elements([
            data_div_id,
            alerts_div_id,
            alarms_div_id,
            events_div_id,
            data_tab_id,
            alarms_tab_id,
            alerts_tab_id,
            events_tab_id,
        ]);
    } else {
        show_elements([
            data_div_id,
            alarms_div_id,
            events_div_id,
            data_tab_id,
            alarms_tab_id,
            events_tab_id,
        ]);
        hide_elements([alerts_div_id, alerts_tab_id]);
    }
};

var display_selected_edges = function (diagram, edges) {
    var edge = model.edges.get(edges[0]);
    var toNode = model.nodes.get(edge.to);
    var fromNode = model.nodes.get(edge.from);
    $("#" + data_div_id).empty();
    renderjson.set_icons("+", "-");
    renderjson.set_show_to_level(1);
    var html = `
                <h6 class="card-subtitle mb-2 text-muted">Connection from ${fromNode.title} to ${toNode.title}</h6>
                <p class="card-text small" id="${data_div_id}-data"></p>
                <h6 class="card-subtitle mb-2 text-muted">From</h6>
                <p class="card-text small" id="${data_div_id}-from"></p>
                <h6 class="card-subtitle mb-2 text-muted">To</h6>
                <p class="card-text small" id="${data_div_id}-to"></p>
                `;
    $("#" + data_div_id).append(html);
    $("#" + data_div_id + "-data").append(renderjson(edge.data));
    $("#" + data_div_id + "-from").append(renderjson(fromNode.data));
    $("#" + data_div_id + "-to").append(renderjson(toNode.data));
    show_elements([data_div_id, data_tab_id]);
    hide_elements([
        alarms_div_id,
        alerts_div_id,
        events_div_id,
        alarms_tab_id,
        alerts_tab_id,
        events_tab_id,
    ]);
};

var display_selected_tile = function (name, members) {
    renderjson.set_icons("+", "-");
    renderjson.set_show_to_level(2);
    var data = [];
    var missing = [];
    for (let member_value of members) {
        var node = model.nodes.get(member_value.id);
        if (node) {
            data.push(node.data);
        } else {
            missing.push(member_value.id);
        }
    }
    data.push({ "missing-nodes": missing });
    var html = `
            <h6 class="card-subtitle mb-2 text-muted" id="${data_div_id}-subtitle">Tile: ${name}</h6>
            <p class="card-text small" id="${data_div_id}-text"></p>
            `;
    $("#" + data_div_id).empty();
    $("#" + data_div_id).append(html);
    $("#" + data_div_id + "-text")[0].appendChild(renderjson(data));
    show_elements([
        data_tab_id,
        alarms_tab_id,
        alerts_tab_id,
        data_div_id,
        alarms_div_id,
        alerts_div_id,
    ]);
    hide_elements([events_tab_id, events_div_id]);
};

var display_no_selection = function () {
    hide_elements([
        data_tab_id,
        alarms_tab_id,
        alerts_tab_id,
        events_tab_id,
        data_div_id,
        alerts_div_id,
        alarms_div_id,
        events_div_id,
    ]);
};

// accepts a list of element IDs to hide
var hide_elements = function (element_list) {
    for (let id in element_list) {
        $("#" + element_list[id]).addClass("d-none");
    }
};

// accepts a list of element IDs to show
var show_elements = function (element_list) {
    // iterate through tabs to show
    for (let id in element_list) {
        $("#" + element_list[id]).removeClass("d-none");
    }
};

var tile_view_listener = function (name, members) {
    var selected = tile_view.selected();
    if (selected === name) {
        // show();
        display_selected_tile(name, members);
    } else if (selected) {
        channels.retrieve_channel(selected).then((members) => {
            display_selected_tile(selected, members);
        });
    } else {
        display_no_selection();
    }
};

diagrams.add_selection_callback(function (diagram, event) {
    // console.log(event);
    if (event.nodes.length > 0) {
        display_selected_nodes(diagram, event.nodes);
    } else if (event.edges.length > 0) {
        display_selected_edges(diagram, event.edges);
    } else if (event.nodes.length == 0 && event.edges.length == 0) {
        display_no_selection();
    }
});

tile_view.add_selection_callback(tile_view_listener);
