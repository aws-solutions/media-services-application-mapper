/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "app/search", "app/ui/util", "app/ui/tile_view", "app/ui/diagrams"],
    function($, model, search, ui_util, tile_view, diagrams) {

        var tab_id = "nav-search-tab";

        var blinks = 10;

        var node_visibility_timer;

        var show = function() {
            $("#" + tab_id).tab('show');
        };

        function display_search_results(results) {
            display_results_search_text(results);
            display_results_model_matches(results);
            display_results_diagram_name_matches(results);
            display_results_diagram_contents_matches(results);
            display_results_tile_name_matches(results);
            display_results_tile_contents_matches(results);
        }

        function display_results_search_text(results) {
            console.log(results);
            $("#search-text-div").text(results.text);
        }

        function display_results_model_matches(results) {
            $("#inventory-match-count").text(results.model.length);
            var html = `<ol>`;
            results.model.forEach(function(node, index) {
                var id = ui_util.makeid();
                var line = `<li><b>${node.title}:</b> <a href="#" title="Drag to a Diagram or Tile" data-node-id="${node.id}" draggable="true" id="${id}">${node.name}</a></li>`;
                html += line;
            });
            var close = `</ol>`;
            html += close;
            $("#global-model-search").html(html);
        }

        function display_results_diagram_name_matches(results) {
            var anchor_handler_data = [];
            $("#diagram-names-match-count").text(results.diagram_names.length);
            var html = `<ol>`;
            results.diagram_names.forEach(function(name, index) {
                var id = ui_util.makeid();
                var line = `<li><a href="#" data-diagram-name="${name}" draggable="true" title="Click or Drag to a Diagram or Tile" id="${id}">${name}</a></li>`;
                html += line;
                anchor_handler_data.push({
                    diagram: diagrams.get_by_name(name),
                    anchor_id: id
                });
            });
            var close = `</ol>`;
            html += close;
            $("#diagram-names-match").html(html);
            anchor_handler_data.forEach(function(item) {
                var anchor_id = item.anchor_id;
                var eventClosure = function() {
                    var diagram = item.diagram;
                    return function(event) {
                        if (!diagram.shown()) {
                            diagram.network.once("afterDrawing", (function() {
                                return function() {
                                    console.log(diagram);
                                    diagram.network.fit();
                                }
                            })());
                            diagram.show();
                        } else {
                            diagram.network.fit();
                        }
                    };
                }();
                $("#" + anchor_id).on("click", eventClosure);
            });

        }

        function display_results_diagram_contents_matches(results) {
            var anchor_handler_data = [];
            $("#diagram-contents-match-count").text(results.diagram_contents.length);
            var html = `<ol>`;
            results.diagram_contents.forEach(function(entry, index) {
                var name = entry.diagram;
                entry.found.forEach(function(node_id, index) {
                    var node = model.nodes.get(node_id)
                    var id = ui_util.makeid();
                    var line = `<li><b>${name}: </b>${node.title}: <a href="#" data-node-id="${node.id}" draggable="true" title="Click or Drag to a Diagram or Tile" id="${id}">${node.name}</a></li>`;
                    html += line;
                    anchor_handler_data.push({
                        diagram: diagrams.get_by_name(name),
                        node_id: node.id,
                        anchor_id: id
                    });
                });
            });
            var close = `</ol>`;
            html += close;
            $("#diagram-contents-match").html(html);
            anchor_handler_data.forEach(function(item) {
                var anchor_id = item.anchor_id;
                var eventClosure = function() {
                    var diagram = item.diagram;
                    var node_id = item.node_id;
                    return function(event) {
                        if (!diagram.shown()) {
                            diagram.network.once("afterDrawing", (function() {
                                return function() {
                                    console.log(diagram);
                                    console.log(node_id);
                                    diagram.network.fit({
                                        nodes: [node_id],
                                        animation: true
                                    });
                                    diagram.blink(blinks, node_id);
                                }
                            })());
                            diagram.show();
                        } else {
                            diagram.network.fit({
                                nodes: [node_id],
                                animation: true
                            });
                            diagram.blink(blinks, node_id);
                        }
                    };
                }();
                $("#" + anchor_id).on("click", eventClosure);
            });
        }

        function display_results_tile_name_matches(results) {
            var anchor_handler_data = [];
            $("#tile-names-match-count").text(results.tile_names.length);
            var html = `<ol>`;
            results.tile_names.forEach(function(name, index) {
                var id = ui_util.makeid();
                var line = `<li><a href="#" title="Click or Drag to a Diagram or Tile" data-tile-name="${name}" draggable="true" id="${id}">${name}</a></li>`;
                html += line;
                anchor_handler_data.push({
                    tile: name,
                    anchor_id: id
                });
            });
            var close = `</ol>`;
            html += close;
            $("#tile-names-match").html(html);
            anchor_handler_data.forEach(function(item) {
                var anchor_id = item.anchor_id;
                var eventClosure = function() {
                    var name = item.tile;
                    return function(event) {
                        $("#channel-tiles-tab").tab('show');
                        tile_view.blink(name);
                    };
                }();
                $("#" + anchor_id).on("click", eventClosure);
            });

        }

        function display_results_tile_contents_matches(results) {
            var anchor_handler_data = [];
            $("#tile-contents-match-count").text(results.tile_contents.length);
            var html = `<ol>`;
            results.tile_contents.forEach(function(entry, index) {
                var name = entry.tile;
                entry.found.forEach(function(node_id, index) {
                    var node = model.nodes.get(node_id)
                    var id = ui_util.makeid();
                    var line = `<li><b><a href="#" title="Click or Drag to a Diagram or Tile" data-tile-name="${name}" draggable="true" id="${id}">${name}</a>: </b>${node.title}: <a href="#" draggable="true" title="Drag to a Diagram or Tile" data-node-id="${node.id}">${node.name}</a></li>`;
                    html += line;
                    anchor_handler_data.push({
                        tile: name,
                        anchor_id: id
                    });
                });
            });
            var close = `</ol>`;
            html += close;
            $("#tile-contents-match").html(html);
            anchor_handler_data.forEach(function(item) {
                var anchor_id = item.anchor_id;
                var eventClosure = function() {
                    var name = item.tile;
                    return function(event) {
                        $("#channel-tiles-tab").tab('show');
                        tile_view.blink(name);
                    };
                }();
                $("#" + anchor_id).on("click", eventClosure);
            });

        }

        var clear_search = function() {
            // enable the show matches button
            $("#only-show-matches-button").prop("disabled", false);
            $("#only-show-matches-button").attr("aria-disabled", "false");
            // enabked the search input and clear it
            $("#search_input").prop("readonly", false);
            $("#search_input").attr("aria-disabled", "false");
            $("#search_input").val("");
            $("#search_input").focus();
            $("#nav-search-subtitle").html("");
            $("#nav-search-text").html("");
            // only_show_matches(false);
            // display_search_results("", []);
            // setTimeout(function() {
            //     update_node_visibility();
            //     update_tile_visibility()
            // }, 500);
            display_search_results({
                text: "",
                model: [],
                tile_names: [],
                tile_contents: [],
                diagram_names: [],
                diagram_contents: []
            });
            $("#nav-status-tab").tab("show");
        };

        var only_show_matches = function(toggle) {
            if (toggle) {
                $("#only-show-matches-button").addClass("active");
                $("#only-show-matches-button").attr("aria-pressed", true);
            } else {
                $("#only-show-matches-button").removeClass("active");
                $("#only-show-matches-button").attr("aria-pressed", false);
            }
        }

        function search_now() {
            show();
            var text = $("#search_input").val();
            var useful = new RegExp("\\S+");
            if (useful.test(text)) {
                search.search(text).then(function(results) {
                    display_search_results(results);
                    // build the results compartment
                });
            } else {
                console.log("whitespace only");
            }
        }

        $("#search-reset-button").on("click", () => {
            clear_search();
            return false;
        });

        // enter key handler
        $("#search_input").keypress(function(event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13') {
                search_now();
            }
        });

        $("#search-now-button").on("click", function(event) {
            search_now();
            return false;
        });

        $("#only-show-matches-button").on("click", (event) => {
            // we get the click, and the previous value of the toggle
            var hidden = !($("#only-show-matches-button").attr("aria-pressed") === "true");
            only_show_matches(hidden);
            $("#search_input").focus();
            setTimeout(function() {
                update_node_visibility(hidden);
                update_tile_visibility(hidden);
            }, 100);
            return false;
        });

    });