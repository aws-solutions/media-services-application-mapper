/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/model", "app/ui/svg_node"], function($, server, connections, model, svg_node) {

    /*
    This module technically adds a new kind of node, but it depends on the 
    MediaPackage node mapper to be complete. This module runs with the connectors 
    to be sure all MediaPackage inventory is loaded first.
    */

    var node_type = "SPEKE Keyserver";

    var update_speke_keyservers = function() {
        var current = connections.get_current();
        var url = current[0];
        var api_key = current[1];
        var nodes = model.nodes;
        var edges = model.edges;
        var rgb = "#cc00ff";
        return new Promise((resolve, reject) => {
            server.get(url + "/cached/speke-keyserver/global", api_key).then((speke_keyservers_cached) => {
                for (var keyserver of speke_keyservers_cached) {
                    var keyserver_data = JSON.parse(keyserver.data);
                    var name = keyserver_data.endpoint;
                    var id = keyserver.arn;
                    var node_data = {
                        "cache_update": keyserver.updated,
                        "id": id,
                        "shape": "image",
                        "image": {
                            "unselected": null,
                            "selected": null
                        },
                        "header": "<b>" + node_type + ":</b> " + keyserver_data.endpoint,
                        "data": keyserver_data,
                        "title": node_type,
                        "name": name,
                        "size": 55,
                        "render": {
                            normal_unselected: (function() {
                                var local_node_type = node_type;
                                var local_name = name;
                                var local_rgb = rgb;
                                var local_id = id;
                                return function() {
                                    return svg_node.unselected(local_node_type, local_name, local_rgb, local_id);
                                };
                            })(),
                            normal_selected: (function() {
                                var local_node_type = node_type;
                                var local_name = name;
                                var local_rgb = rgb;
                                var local_id = id;
                                return function() {
                                    return svg_node.selected(local_node_type, local_name, local_rgb, local_id);
                                };
                            })(),
                            alert_unselected: (function() {
                                var local_node_type = node_type;
                                var local_name = name;
                                var local_id = id;
                                return function() {
                                    return svg_node.unselected(local_node_type, local_name, "#ff0000", local_id);
                                };
                            })(),
                            alert_selected: (function() {
                                var local_node_type = node_type;
                                var local_name = name;
                                var local_id = id;
                                return function() {
                                    return svg_node.selected(local_node_type, local_name, "#ff0000", local_id);
                                };
                            })()
                        },
                        "console_link": (function() {
                            return function() {
                                var html = `https://console.aws.amazon.com/`;
                                return html;
                            };
                        })(),
                        "cloudwatch_link": (function() {
                            return function() {
                                var html = `https://console.aws.amazon.com/`;
                                return html;
                            };
                        })()
                    };
                    node_data.image.selected = node_data.render.normal_selected();
                    node_data.image.unselected = node_data.render.normal_unselected();
                    nodes.update(node_data);
                }
                resolve();
            });
        });
    }
    var update = function() {
        return new Promise((resolve, reject) => {
            update_speke_keyservers().then(function() {
                resolve();
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    return {
        "name": node_type + "s",
        "update": update
    };
});