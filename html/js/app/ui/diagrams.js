/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */
define(["jquery", "lodash", "app/settings", "app/ui/diagram_factory", "app/window", "app/model", "app/channels"],
    function($, _, settings, diagram_factory, window, model, channels) {

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

        var add_diagram = function(name, view_id) {
            var diagram = diagram_factory.create(name, view_id);
            diagrams[name] = diagram;
            // save_diagrams();
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
            var names = Object.keys(diagrams).sort();
            settings.put("diagrams", names).then(function() {
                console.log("diagrams saved");
            });
        };

        var load_diagrams = function() {
            // load diagram names from the cloud on initialization
            settings.get("diagrams").then(function(value) {
                console.log("load user-defined diagrams: " + JSON.stringify(value));
                if (Array.isArray(value)) {
                    for (var diagram_name of value) {
                        var view_id = _.snakeCase(diagram_name);
                        add_diagram(diagram_name, view_id);
                    }
                } else {
                    // no diagrams, create default View from previous
                    console.log("no used-defined diagrams, creating Global diagram");
                    add_diagram("Global", "global");
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

        function get_random_number(max) {
            return Math.floor(Math.random() * Math.floor(max));
        }

        function vary(value, limit) {
            return value + (get_random_number(limit) * (get_random_number(2) == 0 ? -1 : 1));
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
                    diagram.nodes.update(node);
                    // position the node at the drop location
                    var canvas = diagram.network.DOMtoCanvas({
                        x: event.clientX,
                        y: event.clientY
                    });
                    diagram.network.moveNode(node.id, canvas.x, canvas.y - node.size * 2);
                    diagram.blink(6, node.id);
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
                    target_diagram.network.moveNode(node.id, vary(canvas.x, node.size * vary_multiplier), vary(canvas.y, node.size * vary_multiplier));
                });
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
                        target_diagram.network.moveNode(node.id, vary(canvas.x, node.size * vary_multiplier), vary(canvas.y, node.size * vary_multiplier));
                    });
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