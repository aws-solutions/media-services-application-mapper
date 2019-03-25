/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */
define(["jquery", "lodash", "app/ui/util", "app/ui/vis_options", "app/model", "app/ui/layout", "machina", "app/ui/alert"],
    function($, _, ui_util, vis_options, model, layout, machina, alert) {

        function create(diagram) {
            return (function() {
                var my_diagram = diagram;
                return new machina.Fsm({
                    namespace: my_diagram.name,
                    initialState: "uninitialized",
                    states: {
                        uninitialized: {
                            "*": function() {
                                this.deferUntilTransition();
                                this.transition("create-page-container");
                            }
                        },
                        "create-page-container": {
                            _onEnter: function() {
                                // create the html
                                var tab =
                                    `<a class="nav-item nav-link" id="${my_diagram.tab_id}" title="Click or Drag to a Diagram or Tile" data-diagram-name="${my_diagram.name}" draggable="true" data-toggle="tab" href="#${my_diagram.diagram_id}" role="tab" aria-controls="${my_diagram.diagram_id}" aria-selected="false">${my_diagram.name}<i class="material-icons px-1 small">image_aspect_ratio</i></a>`;
                                var diagram_div = `<div id="${my_diagram.diagram_id}" class="tab-pane fade" role="tabpanel" aria-labelledby="${my_diagram.tab_id}" style="height: inherit; width: inherit;"></div>`;
                                // add to containers
                                // my_diagram.tab_container.append(tab);
                                $("#channel-tiles-tab").after(tab);
                                // $("#add-diagram-tab").before(tab);
                                my_diagram.diagram_container.append(diagram_div);
                                my_diagram.container = $("#" + my_diagram.diagram_id);
                                this.transition("create-diagram");
                            }
                        },
                        "create-diagram": {
                            _onEnter: function() {
                                // configure the vis.js network
                                my_diagram.nodes = new vis.DataSet({
                                    queue: false
                                });
                                my_diagram.edges = new vis.DataSet({
                                    queue: false
                                });
                                my_diagram.network = new vis.Network($("#" + my_diagram.diagram_id)[0], {
                                    "nodes": my_diagram.nodes,
                                    "edges": my_diagram.edges
                                }, vis_options.with_layout);
                                my_diagram.drag_container = $("#" + my_diagram.diagram_id);
                                this.transition("connect-event-handlers");
                            }
                        },
                        "connect-event-handlers": {
                            _onEnter: function() {
                                my_diagram.nodes.on("*", (function() {
                                    return function(event, properties, senderId) {
                                        // take a copy of the one-shots in case more get added during event handling
                                        var one_time = Array.from(my_diagram.node_dataset_callbacks_once);
                                        my_diagram.node_dataset_callbacks_once = [];
                                        for (var callback of one_time) {
                                            callback(event, properties, senderId);
                                        }
                                        for (var callback of my_diagram.node_dataset_callbacks) {
                                            callback(event, properties, senderId);
                                        }
                                    };
                                })());
                                my_diagram.network.on("click", (function() {
                                    return function(event) {
                                        // console.log(my_diagram.name + " diagram click");
                                        if (event.nodes.length > 0) {
                                            alert.show(event.nodes.length + " selected");
                                        }
                                        // take a copy of the one-shots in case more get added during event handling
                                        var one_time = Array.from(my_diagram.click_callbacks_once);
                                        my_diagram.click_callbacks_once = [];
                                        for (var callback of one_time) {
                                            callback(my_diagram, event);
                                        }
                                        for (var callback of my_diagram.click_callbacks) {
                                            callback(my_diagram, event);
                                        }
                                    }
                                })());
                                my_diagram.network.on("doubleClick", (function() {
                                    return function(event) {
                                        console.log(my_diagram.name + " diagram doubleClick");
                                        // take a copy of the one-shots in case more get added during event handling
                                        var one_time = Array.from(my_diagram.doubleclick_callbacks_once);
                                        my_diagram.doubleclick_callbacks_once = [];
                                        for (var callback of one_time) {
                                            callback(my_diagram, event);
                                        }
                                        for (var callback of my_diagram.doubleclick_callbacks) {
                                            callback(my_diagram, event);
                                        }
                                        // zoom
                                        if (event.nodes.length > 0) {
                                            my_diagram.fit_to_nodes([event.nodes]);
                                        } else if (event.nodes.length == 0 && event.edges.length == 0) {
                                            var click_x = event.pointer.canvas.x;
                                            var click_y = event.pointer.canvas.y;
                                            my_diagram.fit_to_nearest(click_x, click_y);
                                        }
                                    }
                                })());
                                my_diagram.network.on("dragEnd", function(event) {
                                    if (event.nodes.length) {
                                        layout.save_layout(my_diagram, event.nodes);
                                    }
                                });

                                $("#" + my_diagram.tab_id).on("show.bs.tab", (function() {
                                    return function(event) {
                                        console.log(my_diagram.name + " diagram show.bs.tab");
                                    }
                                })());
                                my_diagram.drag_container.on("mousemove", function(e) {
                                    // console.log("mousemove");
                                    if (my_diagram.drag) {
                                        my_diagram.restore_drawing_surface();
                                        my_diagram.drag_rect.w = (e.pageX - this.offsetLeft) - my_diagram.drag_rect.startX;
                                        my_diagram.drag_rect.h = (e.pageY - this.offsetTop) - my_diagram.drag_rect.startY;
                                        my_diagram.drag_ctx.setLineDash([5]);
                                        my_diagram.drag_ctx.strokeStyle = "rgb(0, 102, 0)";
                                        my_diagram.drag_ctx.strokeRect(my_diagram.drag_rect.startX, my_diagram.drag_rect.startY, my_diagram.drag_rect.w, my_diagram.drag_rect.h);
                                        my_diagram.drag_ctx.setLineDash([]);
                                        my_diagram.drag_ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
                                        my_diagram.drag_ctx.fillRect(my_diagram.drag_rect.startX, my_diagram.drag_rect.startY, my_diagram.drag_rect.w, my_diagram.drag_rect.h);
                                    }
                                    if (e.pageX < 100) {
                                        $("#inventory-drawer-div").animate({
                                            width: "25%",
                                        }, 500, function() {
                                            // Animation complete.
                                        });
                                    }
                                });
                                my_diagram.drag_container.on("mousedown", function(e) {
                                    // console.log("mousedown");
                                    if (e.button == 2) {
                                        selectedNodes = e.ctrlKey ? my_diagram.network.getSelectedNodes() : null;
                                        my_diagram.save_drawing_surface();
                                        my_diagram.drag_rect.startX = e.pageX - this.offsetLeft;
                                        my_diagram.drag_rect.startY = e.pageY - this.offsetTop;
                                        my_diagram.drag = true;
                                        my_diagram.drag_container[0].style.cursor = "crosshair";
                                    }
                                });
                                my_diagram.drag_container.on("mouseup", function(e) {
                                    // console.log("mouseup");
                                    if (e.button == 2) {
                                        my_diagram.restore_drawing_surface();
                                        my_diagram.drag = false;
                                        my_diagram.drag_container[0].style.cursor = "default";
                                        my_diagram.select_nodes_from_highlight();
                                    }
                                });
                                this.transition("restore-nodes");
                            }
                        },
                        "restore-nodes": {
                            _onEnter: function() {
                                my_diagram.restore_nodes().then(function() {
                                    // stop layout of node dump
                                    my_diagram.network.setOptions(vis_options.without_layout);
                                    // next state
                                    my_diagram.statemachine.transition("restore-layout");
                                });
                            }
                        },
                        "restore-layout": {
                            _onEnter: function() {
                                // restore the node layout
                                my_diagram.restore_layout().then(function() {
                                    my_diagram.statemachine.transition("restore-edges");
                                });
                            }
                        },
                        "restore-edges": {
                            _onEnter: function() {
                                // restore the connections
                                my_diagram.restore_edges();
                                my_diagram.statemachine.transition("scale-first-view");
                            }
                        },
                        "scale-first-view": {
                            _onEnter: function() {
                                // hold off fitting until the last possible chance
                                my_diagram.network.once("afterDrawing", (function() {
                                    return function() {
                                        // drag-select
                                        my_diagram.drag_canvas = my_diagram.network.canvas.frame.canvas;
                                        my_diagram.drag_ctx = my_diagram.drag_canvas.getContext('2d');
                                        if (my_diagram.first_fit == false) {
                                            my_diagram.first_fit = true;
                                            my_diagram.network.fit();
                                            my_diagram.statemachine.transition("ready-to-view")
                                        }
                                    }
                                })());
                            }
                        },
                        "ready-to-view": {
                            _onEnter: function() {
                                my_diagram.add_node_dataset_callback(function(event, properties) {
                                    // update edges when a node is added or removed
                                    my_diagram.synchronize_edges(event, properties.items);
                                    my_diagram.synchronize_content(event, properties.items);
                                });
                            }
                        }
                    },
                    start: function() {
                        this.handle("start");
                    }
                });
            })();
        }

        return {
            "create": create
        };

    });