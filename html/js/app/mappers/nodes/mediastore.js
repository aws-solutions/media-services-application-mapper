/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/regions", "app/model", "app/ui/svg_node"],
    function($, server, connections, region_promise, model, svg_node) {

        var update_containers = function() {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            var nodes = model.nodes;
            var rgb = "#D5DBDB";
            var node_type = "MediaStore Container";
            return new Promise((resolve, reject) => {
                server.get(url + "/cached/mediastore-container", api_key).then((cache_entries) => {
                    for (let cache_entry of cache_entries) {
                        var container = JSON.parse(cache_entry.data);
                        var name = container.Name;
                        var id = container.ARN;
                        var node_data = {
                            "cache_update": cache_entry.updated,
                            "id": id,
                            "region": cache_entry.region,
                            "shape": "image",
                            "image": {
                                "unselected": null,
                                "selected": null
                            },
                            "header": "<b>MediaStore Container:</b> " + name,
                            "data": container,
                            "title": "MediaStore Container",
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
                                var id = container.Name;
                                var region = container.ARN.split(":")[3];
                                return function() {
                                    var html = `https://${region}.console.aws.amazon.com/mediastore/home/containers/${id}`;
                                    return html;
                                };
                            })(),
                            "cloudwatch_link": (function() {
                                return function() {
                                    var html = `https://console.aws.amazon.com/cloudwatch/home`;
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
            return update_containers();
        };

        return {
            "name": "MediaStore Containers",
            "update": update
        };
    });