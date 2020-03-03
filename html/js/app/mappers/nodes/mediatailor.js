/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/regions", "app/model", "app/ui/svg_node"],
    function($, server, connections, region_promise, model, svg_node) {

        var update_configs = function(regionName) {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            return new Promise(function(resolve, reject) {
                server.get(url + "/cached/mediatailor-configuration/" + regionName, api_key).then(function(configs) {
                    for (let cache_entry of configs) {
                        // console.log(cache_entry);
                        map_config(cache_entry);
                    }
                    resolve();
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        var map_config = function(cache_entry) {
            var config = JSON.parse(cache_entry.data);
            var name = config.Name;
            var id = config.PlaybackConfigurationArn;
            var nodes = model.nodes;
            var rgb = "#80e5ff";
            var node_type = "MediaTailor Configuration";
            var node_data = {
                "overlay": "informational",
                "cache_update": cache_entry.updated,
                "id": id,
                "region": cache_entry.region,
                "shape": "image",
                "image": {
                    "unselected": null,
                    "selected": null
                },
                "header": "<b>" + node_type + ":</b> " + name,
                "data": config,
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
                    var region = id.split(":")[3];
                    return function() {
                        var html = `https://console.aws.amazon.com/mediatailor/home?region=${region}#/config/${name}`;
                        return html;
                    };
                })(),
                "cloudwatch_link": (function() {
                    var region = id.split(":")[3];
                    return function() {
                        var html = `https://console.aws.amazon.com/cloudwatch/home?region=${region}#logs:prefix=MediaTailor`;
                        return html;
                    };
                })()
            };
            node_data.image.selected = node_data.render.normal_selected();
            node_data.image.unselected = node_data.render.normal_unselected();
            nodes.update(node_data);
        };


        var update = function() {
            return new Promise((resolve, reject) => {
                region_promise().then(function(regions) {
                    var promises = [];
                    for (let regionName of regions.get_selected()) {
                        promises.push(update_configs(regionName));
                    }
                    Promise.all(promises).then(function() {
                        resolve();
                    }).catch(function() {
                        reject();
                    });
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        return {
            "name": "MediaTailor Configurations",
            "update": update
        };
    });