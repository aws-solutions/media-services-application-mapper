/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// {
//     "arn": "arn:msam:user-defined-node:global:<ACCOUNT>:<GUID>",
//     "data": "{ "NodeType": "Elemental Live Encoder", "Id": "mktlivelab-4.elementalad.com" }",
//     "expires": 1535857826,
//     "region": "global",
//     "service": "user-defined-node",
//     "updated": 1535850626
// }

define(["jquery", "app/server", "app/connections", "app/model", "app/ui/svg_node"],
    function($, server, connections, model, svg_node) {

        var update_distributions = function() {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            var nodes = model.nodes;
            return new Promise((resolve, reject) => {
                server.get(url + "/cached/user-defined-node/global", api_key).then((cache_entries) => {
                    for (let cache_entry of cache_entries) {
                        var color = "#D5DBDB";
                        var item = JSON.parse(cache_entry.data);
                        var name = item.Id;
                        if (cache_entry.color) {
                            color = cache_entry.color;
                        }
                        var node_type = item.NodeType;
                        var id = cache_entry.arn;
                        var node_data = {
                            "cache_update": cache_entry.updated,
                            "id": id,
                            "region": cache_entry.region,
                            "shape": "image",
                            "image": {
                                "unselected": svg_node.unselected(node_type, name, color, id),
                                "selected": svg_node.selected(node_type, name, color, id)
                            },
                            "header": "<b>" + node_type + ":</b> " + name,
                            "data": item,
                            "title": node_type,
                            "name": name,
                            "size": 55,
                            "render": {
                                normal_unselected: (function() {
                                    var local_node_type = node_type;
                                    var local_name = name;
                                    var local_color = color;
                                    var local_id = id;
                                    return function() {
                                        return svg_node.unselected(local_node_type, local_name, local_color, local_id);
                                    };
                                })(),
                                normal_selected: (function() {
                                    var local_node_type = node_type;
                                    var local_name = name;
                                    var local_color = color;
                                    var local_id = id;
                                    return function() {
                                        return svg_node.selected(local_node_type, local_name, local_color, local_id);
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
                                })(),
                                degrated_unselected: (function() {
                                    var local_node_type = node_type;
                                    var local_name = name;
                                    var local_id = id;
                                    return function() {
                                        return svg_node.unselected(local_node_type, local_name, "#ffcccc", local_id);
                                    };
                                })(),
                                degrated_selected: (function() {
                                    var local_node_type = node_type;
                                    var local_name = name;
                                    var local_id = id;
                                    return function() {
                                        return svg_node.selected(local_node_type, local_name, "#ffcccc", local_id);
                                    };
                                })()
                            },
                            "console_link": (function() {
                                return function() {
                                    var html = `#`;
                                    return html;
                                };
                            })(),
                            "cloudwatch_link": (function() {
                                return function() {
                                    var html = `#`;
                                    return html;
                                };
                            })()
                        };
                        node_data.image.selected = node_data.render.normal_selected();
                        node_data.image.unselected = node_data.render.normal_unselected();
                        nodes.update(node_data);
                    }
                    resolve();
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        var update = function() {
            return update_distributions();
        };

        return {
            "name": "User-Defined Nodes",
            "update": update
        };
    });