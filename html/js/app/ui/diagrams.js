/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */
define(["jquery", "lodash", "app/settings", "app/ui/diagram_factory", "app/model", "app/channels", "app/ui/layout", "app/ui/util"],
    function($, _, settings, diagram_factory, model, channels, layout, ui_util) {

        var vary_multiplier = 8;

        var diagrams = {};

        var drag_id;
        var drag_type;

        var shown_diagram = function() {
            var shown = null;
            for (var d of Object.values(diagrams)) {
                if (d.shown()) {
                    shown = d;
                    break;
                }
            }
            return shown;
        };

        var list_diagrams = function() {
            return diagrams;
        };

        var add_diagram = function(name, view_id, save) {
            var diagram = diagram_factory.create(name, view_id);
            diagrams[name] = diagram;
            if (save) {
                save_diagrams();
            }
            return diagram;
        };

        var remove_diagram = function(name) {
            // remove page elements
            diagrams[name].remove();
            // remove object
            delete diagrams[name];
            // update settings
            save_diagrams();
        };

        var get_diagram = function(name) {
            return diagrams[name];
        };

        var save_diagrams = function() {
            // var settings = _.map(Object.values(diagrams), ["name", "view_id"]);
            var diagram_map = _.map(Object.values(diagrams), function(item) {
                return { "name": item.name, "view_id": item.view_id }
            });
            // console.log(settings);
            settings.put("diagrams", diagram_map).then(function() {
                console.log("diagrams saved");
            }).catch(function(error) {
                console.log(error);
            });
        };

        var load_diagrams = function() {
            // load diagram names from the cloud on initialization
            settings.get("diagrams").then(function(diagrams) {
                console.log("load user-defined diagrams: " + JSON.stringify(diagrams));
                if (Array.isArray(diagrams)) {
                    diagrams.forEach(function(diagram) {
                        add_diagram(diagram.name, diagram.view_id, false);
                    });
                } else {
                    // no diagrams, create default View from previous Global View
                    console.log("no used-defined diagrams, creating default diagram");
                    add_diagram("Global", "global", true);
                }
            });
        }

        function have_all(node_ids) {
            var results = [];
            node_ids = node_ids || [];
            if (!Array.isArray(node_ids)) {
                node_ids = [node_ids];
            }
            for (var name in diagrams) {
                var diagram = diagrams[name];
                var found = diagram.nodes.get(node_ids);
                if (found.length == node_ids.length) {
                    results.push({
                        diagram: name,
                        found: node_ids
                    });
                }
            }
            return results;
        }

        function have_any(node_ids) {
            var results = [];
            node_ids = node_ids || [];
            if (!Array.isArray(node_ids)) {
                node_ids = [node_ids];
            }
            var nodes;
            // array of nodes or nodes ids?
            if (node_ids.length > 0) {
                if (typeof node_ids[0] == 'object') {
                    // nodes, convert to ids
                    nodes = node_ids;
                    node_ids = [];
                    nodes.forEach(function(value, index) {
                        node_ids.push(value.id);
                    });
                }
            }
            Object.values(diagrams).forEach(function(diagram, index) {
                var intersect = _.intersection(diagram.nodes.getIds().sort(), node_ids.sort());
                if (intersect.length > 0) {
                    results.push({
                        diagram: diagram.name,
                        found: intersect.sort()
                    });
                }
            });
            return results;
        }

        load_diagrams();

        $("body").on("dragstart", function(event) {
            try {
                if (event.target.attributes["data-node-id"]) {
                    console.log("dragging node");
                    var node_id = event.target.attributes["data-node-id"].value;
                    drag_id = node_id;
                    drag_type = "node";
                } else
                if (event.target.attributes["data-diagram-name"]) {
                    console.log("dragging diagram");
                    var diagram_name = event.target.attributes["data-diagram-name"].value;
                    drag_id = diagram_name;
                    drag_type = "diagram";
                } else
                if (event.target.attributes["data-tile-name"]) {
                    console.log("dragging channel tile");
                    var tile_name = event.target.attributes["data-tile-name"].value;
                    drag_id = tile_name;
                    drag_type = "tile";
                } else {
                    console.log("ignoring unknown draggable");
                }
            } catch (exception) {
                console.log(exception);
            }
        });

        $("#diagram-tab-content")[0].addEventListener("dragenter", function(event) {
            event.preventDefault();
        }, false);

        $("#diagram-tab-content")[0].addEventListener("dragover", function(event) {
            event.preventDefault();
        }, false);

        $("#diagram-tab-content")[0].addEventListener("dragleave", function(event) {}, false);

        $("#diagram-tab-content")[0].addEventListener("dragend", function(event) {
            event.preventDefault();
        }, false);

        $("#diagram-tab-content")[0].addEventListener("drop", function(event) {
            console.log(event);
            event.preventDefault();
            if (drag_type == "node" && drag_id) {
                var diagram = shown_diagram();
                console.log("add node " + drag_id + " to diagram " + diagram.name);
                var node = model.nodes.get(drag_id);
                if (node) {
                    var canvas = diagram.network.DOMtoCanvas({
                        x: event.clientX,
                        y: event.clientY
                    });
                    // this should be for initial placement only
                    node.x = canvas.x;
                    node.y = canvas.y - node.size * 2;
                    diagram.nodes.update(node);
                    // position the node at the drop location
                }
            } else
            if (drag_type == "diagram" && drag_id) {
                var source_diagram = get_diagram(drag_id);
                var target_diagram = shown_diagram();
                console.log("add diagram contents from " + source_diagram.name + " to diagram " + target_diagram.name);
                var nodes = source_diagram.nodes.get();
                // position the nodes around the drop location
                var canvas = target_diagram.network.DOMtoCanvas({
                    x: event.clientX,
                    y: event.clientY
                });
                target_diagram.nodes.update(nodes);
                Array.from(nodes).forEach(function(node) {
                    target_diagram.network.moveNode(node.id, ui_util.vary(canvas.x, node.size * vary_multiplier), ui_util.vary(canvas.y, node.size * vary_multiplier));
                });
                var node_ids = _.map(Array.from(nodes), "id");
                layout.save_layout(target_diagram, node_ids);
                target_diagram.network.fit();
            } else
            if (drag_type == "tile" && drag_id) {
                var tile_name = drag_id;
                var target_diagram = shown_diagram();
                console.log("add tile contents from " + tile_name + " to diagram " + target_diagram.name);
                channels.retrieve_channel(tile_name).then(function(contents) {
                    var channel_node_ids = _.map(contents, "id").sort();
                    // vis returns null for each id it can't find, therefore _.compact
                    var nodes = _.compact(model.nodes.get(channel_node_ids));
                    var canvas = target_diagram.network.DOMtoCanvas({
                        x: event.clientX,
                        y: event.clientY
                    });
                    target_diagram.nodes.update(nodes);
                    Array.from(nodes).forEach(function(node) {
                        target_diagram.network.moveNode(node.id, ui_util.vary(canvas.x, node.size * vary_multiplier), ui_util.vary(canvas.y, node.size * vary_multiplier));
                    });
                    var node_ids = _.map(Array.from(nodes), "id");
                    layout.save_layout(target_diagram, node_ids);
                    target_diagram.network.fit();
                });
            }
        }, false);

        return {
            shown: shown_diagram,
            list: list_diagrams,
            add: add_diagram,
            remove: remove_diagram,
            get: get_diagram,
            have_all: have_all,
            have_any: have_any
        };

    });