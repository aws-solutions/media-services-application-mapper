/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */
define(["jquery", "lodash", "app/settings", "app/ui/diagram_factory", "app/model", "app/channels", "app/ui/layout", "app/ui/util"],
    function($, _, settings, diagram_factory, model, channels, layout, ui_util) {

        var diagrams = {};

        var selection_callbacks = [];

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

        var add_selection_callback = function(callback) {
            if (!selection_callbacks.includes(callback)) {
                selection_callbacks.push(callback);
            }
        }

        var add_diagram = function(name, view_id, save) {
            var diagram = diagram_factory.create(name, view_id);
            diagrams[name] = diagram;
            if (save) {
                save_diagrams();
            }
            diagram.add_singleclick_callback(function(diagram, event) {
                selection_callbacks.forEach(function(callback) {
                    try {
                        callback(diagram, event);
                    } catch (error) {
                        console.log(error);
                    }
                });
            });
            return diagram;
        };

        var remove_diagram = function(name) {
            // remove page elements
            diagrams[name].remove();
            // remove object
            delete diagrams[name];
            // update settings
            save_diagrams();
            // select the tile tab
            $("#channel-tiles-tab").tab('show');
        };

        var get_diagram = function(name) {
            return diagrams[name];
        };

        var save_diagrams = function() {
            // var settings = _.map(Object.values(diagrams), ["name", "view_id"]);
            var diagram_map = _.map(Object.values(diagrams), function(item) {
                return {
                    "name": item.name,
                    "view_id": item.view_id
                }
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
                    console.log("no used-defined diagrams, creating default global diagram");
                    add_diagram("Default", "global", true);
                }
            });
        }

        function have_all(node_ids) {
            var results = [];
            if (!Array.isArray(node_ids)) {
                node_ids = [node_ids];
            }
            for (var name in diagrams) {
                var diagram = diagrams[name];
                var found = _.compact(diagram.nodes.get(node_ids));
                if (found.length === node_ids.length) {
                    results.push(diagram);
                }
            }
            return _.orderBy(results, ["name"]);
        }

        function have_any(node_ids) {
            var results = [];
            node_ids = node_ids || [];
            if (!Array.isArray(node_ids)) {
                node_ids = [node_ids];
            }
            Object.values(diagrams).forEach(function(diagram) {
                var intersect = _.intersection(diagram.nodes.getIds().sort(), node_ids.sort());
                if (intersect.length > 0) {
                    results.push({
                        diagram: diagram.name,
                        found: intersect
                    });
                }
            });
            return _.orderBy(results, ["diagram"]);;
        }

        load_diagrams();

        return {
            shown: shown_diagram,
            list: list_diagrams,
            add: add_diagram,
            remove: remove_diagram,
            get: get_diagram,
            have_all: have_all,
            have_any: have_any,
            add_selection_callback: add_selection_callback
        };

    });