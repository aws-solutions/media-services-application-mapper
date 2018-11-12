/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "vis", "app/model", "app/ui/vis_options", "app/ui/layout", "app/ui/alert", "app/settings"],
    function($, vis, model, vis_options, layout, alert, settings) {

        var click_listeners = [];

        var LAYOUT_INITIAL = "initial";
        var LAYOUT_MANUAL = "manual";
        var LAYOUT_AUTO = "auto";
        var layout_mode = LAYOUT_INITIAL;

        var network;
        var view_name = "global";
        var tab_id = "global-model-tab";
        var div_id = "global-model-diagram";

        var fit = function(ids) {
            if (undefined === ids) {
                network.fit({
                    animation: true
                });
            } else {
                network.fit({
                    nodes: ids,
                    animation: true
                });
            }
        };

        // drag-select

        var container = $("#global-model-diagram");
        var canvas;
        var ctx;
        var rect = {};
        var drag = false;
        var drawingSurfaceImageData;

        var init = function() {
            if (network === undefined) {
                var container = $("#" + div_id)[0];
                network = new vis.Network(container, {
                    "nodes": model.nodes,
                    "edges": model.edges
                }, vis_options.with_layout);
                network.on("click", (function() {
                    return function(event) {
                        console.log(event);
                        alert.show(event.nodes.length + " selected");
                        $.each(click_listeners, function(i, callback) {
                            callback(event);
                        });
                    }
                })());
                network.on("doubleClick", function(event) {
                    console.log(event);
                    $.each(click_listeners, function(i, callback) {
                        callback(event);
                    });
                });
                network.on("stabilized", function(event) {
                    console.log("layout mode = " + layout_mode);
                    if (layout_mode === LAYOUT_INITIAL || layout_mode === LAYOUT_AUTO) {
                        network.setOptions(vis_options.without_layout);
                    }
                    if (layout_mode === LAYOUT_INITIAL) {
                        layout.restore_view(view_name).then(function(layout_items) {
                            $.each(layout_items, function(i, item) {
                                if (model.nodes.get(item.id) !== null) {
                                    network.moveNode(item.id, item.x, item.y);
                                } else {
                                    console.log("delete layout for node id " + item.id);
                                }
                            });
                        }).catch(function(error) {
                            console.log(error);
                        });
                        console.log("layout restored");
                        alert.show("Layout restored");
                        setTimeout(fit, 1000);
                    }
                    layout_mode = LAYOUT_MANUAL;
                });
                network.on("dragEnd", function(event) {
                    // console.log("saving position after drag");
                    $.each(event.nodes, function(index, value) {
                        var node = model.nodes.get(value)
                        var positions = network.getPositions([node.id]);
                        layout.save_node(view_name, node, positions[node.id].x, positions[node.id].y).then(function(response) {
                            // console.log("ok");
                        }).catch(function(error) {
                            console.log(error);
                        });
                    });
                });
                // drag-select
                canvas = network.canvas.frame.canvas;
                ctx = canvas.getContext('2d');
            }
            // else {
            //     network.setOptions(vis_options.without_layout);
            // }
        };

        var show = function() {
            $("#" + tab_id).tab('show');
        };

        var get_selected = function() {
            return {
                "nodes": network.getSelectedNodes(),
                "edges": network.getSelectedEdges()
            }
        };

        var vertical_layout = function() {
            settings.get("layout-method").then(function(response) {
                var method = response.method;
                layout_mode = LAYOUT_AUTO;
                var options = vis_options.vertical_layout;
                console.log(options);
                options.layout.hierarchical.sortMethod = method;
                network.setOptions(options);
                setTimeout(function() {
                    console.log("vertical layout finished");
                    network.setOptions(vis_options.without_layout);
                    layout_mode = LAYOUT_MANUAL;
                    isolated_item_layout();
                    fit();
                    layout.save_layout(view_name);
                }, 1500);
            });
        };

        var horizontal_layout = function() {
            settings.get("layout-method").then(function(response) {
                var method = response.method;
                layout_mode = LAYOUT_AUTO;
                var options = vis_options.horizontal_layout;
                options.layout.hierarchical.sortMethod = method;
                network.setOptions(options);
                setTimeout(function() {
                    console.log("horizontal layout finished");
                    network.setOptions(vis_options.without_layout);
                    layout_mode = LAYOUT_MANUAL;
                    isolated_item_layout();
                    fit();
                    layout.save_layout(view_name);
                }, 1500);
            });
        };

        var node_dimensions = function() {
            var max_width = Number.MIN_SAFE_INTEGER;
            var max_height = Number.MIN_SAFE_INTEGER;
            $.each(model.nodes.getIds(), function(index, id) {
                var box = network.getBoundingBox(id);
                var height = Math.abs(box.bottom - box.top);
                var width = Math.abs(box.right - box.left);
                if (height > max_height) {
                    max_height = height;
                }
                if (width > max_width) {
                    max_width = width;
                }
            });
            return {
                "max_width": max_width,
                "max_height": max_height
            }
        };

        var model_bounds = function() {
            var min_x = Number.MAX_SAFE_INTEGER;
            var max_x = Number.MIN_SAFE_INTEGER;
            var min_y = Number.MAX_SAFE_INTEGER;
            var max_y = Number.MIN_SAFE_INTEGER;
            var positions = network.getPositions();
            $.each(positions, function(pos_index, pos_value) {
                if (pos_value.x > max_x) {
                    max_x = pos_value.x;
                }
                if (pos_value.x < min_x) {
                    min_x = pos_value.x;
                }
                if (pos_value.y > max_y) {
                    max_y = pos_value.y;
                }
                if (pos_value.y < min_y) {
                    min_y = pos_value.y;
                }
            });
            return {
                "min_x": min_x,
                "max_x": max_x,
                "min_y": min_y,
                "max_y": max_y
            }
        };

        var isolated_item_layout = function() {
            var isolated = isolated_nodes();
            var dimensions = node_dimensions();
            var pad_x = Math.ceil(dimensions.max_width * 1.25);
            var pad_y = Math.ceil(dimensions.max_height * 1.25);
            isolated.forEach(function(value, key, map) {
                var node_ids = value;
                var bounds = model_bounds();
                // extra padding at the start
                var start_x = bounds.max_x + (pad_x * 2);
                var current_x = start_x;
                var current_y = bounds.min_y + pad_y;
                var nodes_per_row = Math.ceil(Math.sqrt(node_ids.length));
                var current_row_nodes = 0;
                $.each(node_ids, function(id_index, id) {
                    network.moveNode(id, current_x, current_y);
                    current_row_nodes += 1;
                    if (current_row_nodes < nodes_per_row) {
                        current_x += pad_x;
                    } else {
                        current_row_nodes = 0;
                        current_x = start_x;
                        current_y += pad_y;
                    }
                });
            });
            layout.save_layout(view_name);
        };

        var isolated_nodes = function() {
            // get the isolated elements, arrange by type in map
            var isolated = new Map();
            $.each(model.nodes.getIds(), function(id_index, node_id) {
                var connected = network.getConnectedNodes(node_id);
                if (connected.length === 0) {
                    var node = model.nodes.get(node_id);
                    var group = isolated.get(node.title);
                    if (!group) {
                        group = [node_id];
                    } else {
                        group.push(node_id);
                    }
                    isolated.set(node.title, group);
                }
            });
            return isolated;
        };

        container.on("mousemove", function(e) {
            if (drag) {
                restoreDrawingSurface();
                rect.w = (e.pageX - this.offsetLeft) - rect.startX;
                rect.h = (e.pageY - this.offsetTop) - rect.startY;
                ctx.setLineDash([5]);
                ctx.strokeStyle = "rgb(0, 102, 0)";
                ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
                ctx.setLineDash([]);
                ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
                ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
            }
        });

        container.on("mousedown", function(e) {
            if (e.button == 2) {
                selectedNodes = e.ctrlKey ? network.getSelectedNodes() : null;
                saveDrawingSurface();
                var that = this;
                rect.startX = e.pageX - this.offsetLeft;
                rect.startY = e.pageY - this.offsetTop;
                drag = true;
                container[0].style.cursor = "crosshair";
            }
        });

        container.on("mouseup", function(e) {
            if (e.button == 2) {
                restoreDrawingSurface();
                drag = false;

                container[0].style.cursor = "default";
                selectNodesFromHighlight();
            }
        });

        function saveDrawingSurface() {
            drawingSurfaceImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        function restoreDrawingSurface() {
            ctx.putImageData(drawingSurfaceImageData, 0, 0);
        }

        function selectNodesFromHighlight() {
            var fromX, toX, fromY, toY;
            var nodesIdInDrawing = [];
            var xRange = getStartToEnd(rect.startX, rect.w);
            var yRange = getStartToEnd(rect.startY, rect.h);

            var allNodes = model.nodes.get();
            for (var i = 0; i < allNodes.length; i++) {
                var curNode = allNodes[i];
                var nodePosition = network.getPositions([curNode.id]);
                var nodeXY = network.canvasToDOM({
                    x: nodePosition[curNode.id].x,
                    y: nodePosition[curNode.id].y
                });
                if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) {
                    nodesIdInDrawing.push(curNode.id);
                }
            }
            network.selectNodes(nodesIdInDrawing);
            alert.show(nodesIdInDrawing.length + " selected");
        }

        function getStartToEnd(start, theLen) {
            return theLen > 0 ? {
                start: start,
                end: start + theLen
            } : {
                start: start + theLen,
                end: start
            };
        }

        // this shuts down the browser's context menu
        document.body.oncontextmenu = function() {
            return false;
        };

        return {
            "init": init,
            "show": show,
            "fit": fit,
            "get_selected": get_selected,
            "set_selected": function(node_ids) {
                network.selectNodes(nodes_ids, true);
            },
            "add_click_listener": function(f) {
                click_listeners.push(f);
            },
            "name": view_name,
            "get_network": function() {
                return network;
            },
            "vertical_layout": vertical_layout,
            "horizontal_layout": horizontal_layout,
            "model_bounds": model_bounds,
            "isolated_item_layout": isolated_item_layout
        }
    });