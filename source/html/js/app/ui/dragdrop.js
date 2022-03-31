/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as channels from "../channels.js";
import * as layout from "./layout.js";
import * as diagrams from "./diagrams.js";
import * as tile_view from "./tile_view.js";
import * as confirmation from "./confirmation.js";
import * as alert from "./alert.js";
import * as channels_menu from "./channels_menu.js";

var drag_id;
var drag_type;

function drop_node_to_diagram(event) {
    var diagram = diagrams.shown();
    var node;
    var canvas;
    if (diagram) {
        console.log("add node " + drag_id + " to diagram " + diagram.name);
        node = model.nodes.get(drag_id);
        if (node) {
            /*ignore jslint start*/
            canvas = diagram.network.DOMtoCanvas({
                x: event.clientX,
                y: event.clientY,
            });
            /*ignore jslint end*/
            diagram.nodes.update(node);
            diagram.network.moveNode(node.id, canvas.x, canvas.y);
        }
    }
}

function drop_node_to_tile(tile) {
    // get node
    var node = model.nodes.get(drag_id);
    var name = filterXSS(tile.attr("data-channel-name"));
    var html;
    if (node) {
        html = `Add ${node.header} to tile ${name}?`;
        confirmation.show(html, function () {
            // confirm add node to tile
            channels.update_channel(name, [node.id]).then(function () {
                alert.show("Added to tile");
                tile_view.redraw_tiles();
            });
        });
    }
}

function drop_diagram_to_diagram() {
    var source_diagram = diagrams.get_by_name(drag_id);
    var target_diagram = diagrams.shown();
    var nodes;
    var node_ids;
    if (source_diagram && target_diagram) {
        console.log(
            "add diagram contents from " +
                source_diagram.name +
                " to diagram " +
                target_diagram.name
        );
        nodes = source_diagram.nodes.get();
        target_diagram.nodes.update(nodes);
        node_ids = _.map(Array.from(nodes), "id");
        layout.save_layout(target_diagram, node_ids);
        target_diagram.network.fit();
    }
}

function drop_diagram_to_tile(tile) {
    var name = filterXSS(tile.attr("data-channel-name"));
    var source_diagram = diagrams.get_by_name(drag_id);
    var node_ids;
    var html;
    if (source_diagram) {
        console.log(
            "add diagram contents from " +
                source_diagram.name +
                " to tile " +
                name
        );
        html = `Add contents from diagram ${source_diagram.name} to tile ${name}?`;
        confirmation.show(html, function () {
            node_ids = source_diagram.nodes.getIds();
            channels.update_channel(name, node_ids).then(function () {
                alert.show("Added to tile");
                tile_view.redraw_tiles();
            });
        });
    }
}

function drop_tile_to_diagram() {
    var tile_name = drag_id;
    var target_diagram = diagrams.shown();
    if (target_diagram) {
        console.log(
            "add tile contents from " +
                tile_name +
                " to diagram " +
                target_diagram.name
        );
        channels.retrieve_channel(tile_name).then(function (contents) {
            var channel_node_ids = _.map(contents, "id").sort();
            // vis returns null for each id it can't find, therefore _.compact
            var nodes = _.compact(model.nodes.get(channel_node_ids));
            var node_ids;
            target_diagram.nodes.update(nodes);
            node_ids = _.map(Array.from(nodes), "id");
            layout.save_layout(target_diagram, node_ids);
            target_diagram.network.fit();
        });
    }
}

function drop_tile_to_tile(tile) {
    var source_tile_name = drag_id;
    var target_tile_name = tile.attr("data-channel-name");
    var html;
    if (source_tile_name !== target_tile_name) {
        html = `Add contents from tile ${source_tile_name} to tile ${target_tile_name}?`;
        confirmation.show(html, function () {
            var source_node_ids;
            channels
                .retrieve_channel(source_tile_name)
                .then(function (source_contents) {
                    source_node_ids = _.map(source_contents, "id").sort();
                    return channels.update_channel(
                        target_tile_name,
                        source_node_ids
                    );
                })
                .then(function () {
                    alert.show("Added to tile");
                    tile_view.redraw_tiles();
                });
        });
    }
}

function drop_node_to_tile_canvas() {
    var node = model.nodes.get(drag_id);
    var html;
    if (node) {
        html = `Create a new tile with ${node.header}?`;
        confirmation.show(html, function () {
            // confirm add node to tile
            channels_menu.show_quick_new_tile([node.id]);
        });
    }
}

function drop_diagram_to_tile_canvas() {
    var diagram = diagrams.get_by_name(drag_id);
    var html;
    if (diagram) {
        html = `Create a new tile from diagram ${diagram.name} contents?`;
        confirmation.show(html, function () {
            var node_ids = diagram.nodes.getIds();
            // confirm add node to tile
            channels_menu.show_quick_new_tile(node_ids);
        });
    }
}

function drop_tile_to_tile_canvas() {
    var source_tile_name = drag_id;
    var html = `Create a new tile from tile ${source_tile_name} contents?`;
    confirmation.show(html, function () {
        var source_node_ids;
        channels
            .retrieve_channel(source_tile_name)
            .then(function (source_contents) {
                source_node_ids = _.map(source_contents, "id").sort();
                channels_menu.show_quick_new_tile(source_node_ids);
            });
    });
}

$("body").on("dragstart", function (event) {
    try {
        if (event.target.attributes["data-node-id"]) {
            console.log("dragging node");
            drag_id = event.target.attributes["data-node-id"].value;
            drag_type = "node";
        } else if (event.target.attributes["data-diagram-name"]) {
            console.log("dragging diagram");
            drag_id = event.target.attributes["data-diagram-name"].value;
            drag_type = "diagram";
        } else if (event.target.attributes["data-tile-name"]) {
            console.log("dragging tile");
            drag_id = event.target.attributes["data-tile-name"].value;
            drag_type = "tile";
        } else {
            console.log("ignoring unknown draggable");
        }
    } catch (exception) {
        console.log(exception);
    }
});

$("#diagram-tab-content")[0].addEventListener(
    "dragenter",
    async function (event) {
        const shown = diagrams.shown();
        if (shown) {
            if (await shown.isLocked()) {
                event.dataTransfer.dropEffect = "none";
            } else {
                event.dataTransfer.dropEffect = "copy";
                event.preventDefault();
            }
        } else {
            event.dataTransfer.dropEffect = "copy";
            event.preventDefault();
        }
    },
    false
);

$("#diagram-tab-content")[0].addEventListener(
    "dragover",
    async function (event) {
        const shown = diagrams.shown();
        if (shown) {
            if (await shown.isLocked()) {
                event.dataTransfer.dropEffect = "none";
            } else {
                event.dataTransfer.dropEffect = "copy";
                event.preventDefault();
            }
        } else {
            event.dataTransfer.dropEffect = "copy";
            event.preventDefault();
        }
    },
    false
);

$("#diagram-tab-content")[0].addEventListener(
    "dragend",
    function (event) {
        event.preventDefault();
    },
    false
);

$("#diagram-tab-content")[0].addEventListener(
    "drop",
    function (event) {
        var tile;
        event.preventDefault();
        if (drag_type === "node" && drag_id) {
            if (diagrams.shown()) {
                drop_node_to_diagram(event);
            } else if (tile_view.shown()) {
                tile = $(event.target).parents("div[data-channel-name]");
                console.log(tile);
                if (tile.length === 1) {
                    drop_node_to_tile(tile);
                } else {
                    drop_node_to_tile_canvas();
                }
            }
        } else if (drag_type === "diagram" && drag_id) {
            if (diagrams.shown()) {
                drop_diagram_to_diagram();
            } else if (tile_view.shown()) {
                tile = $(event.target).parents("div[data-channel-name]");
                console.log(tile);
                if (tile.length === 1) {
                    drop_diagram_to_tile(tile);
                } else {
                    drop_diagram_to_tile_canvas();
                }
            }
        } else if (drag_type === "tile" && drag_id) {
            if (diagrams.shown()) {
                drop_tile_to_diagram();
            } else if (tile_view.shown()) {
                tile = $(event.target).parents("div[data-channel-name]");
                console.log(tile);
                if (tile.length === 1) {
                    drop_tile_to_tile(tile);
                } else {
                    drop_tile_to_tile_canvas();
                }
            }
        }
    },
    false
);
