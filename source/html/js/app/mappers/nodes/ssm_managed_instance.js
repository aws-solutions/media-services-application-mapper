/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/regions", "app/model", "app/ui/svg_node"],
    function($, server, connections, region_promise, model, svg_node) {

        var update_configs = function() {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            return new Promise(function(resolve, reject) {
                server.get(url + "/cached/ssm-managed-instance", api_key).then(function(configs) {
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
            const config = JSON.parse(cache_entry.data);
            const name = config.Id;
            const id = cache_entry.arn;
            const nodes = model.nodes;
            const rgb = "#D5DBDB";
            const generic_node_type = "SSM Managed Instance";
            var node_type = generic_node_type;
            if ('Tags' in config) {
                if ('MSAM-NodeType' in config.Tags) {
                    node_type = config.Tags['MSAM-NodeType'];
                }
            }
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
                        var local_generic_node_type = generic_node_type;
                        return function() {
                            return svg_node.unselected(local_node_type, local_name, local_rgb, local_id, config, local_generic_node_type);
                        };
                    })(),
                    normal_selected: (function() {
                        var local_node_type = node_type;
                        var local_name = name;
                        var local_rgb = rgb;
                        var local_id = id;
                        var local_generic_node_type = generic_node_type;
                        return function() {
                            return svg_node.selected(local_node_type, local_name, local_rgb, local_id, config, local_generic_node_type);
                        };
                    })(),
                    alert_unselected: (function() {
                        var local_node_type = node_type;
                        var local_name = name;
                        var local_id = id;
                        var local_generic_node_type = generic_node_type;
                        return function() {
                            return svg_node.unselected(local_node_type, local_name, "#ff0000", local_id, config, local_generic_node_type);
                        };
                    })(),
                    alert_selected: (function() {
                        var local_node_type = node_type;
                        var local_name = name;
                        var local_id = id;
                        var local_generic_node_type = generic_node_type;
                        return function() {
                            return svg_node.selected(local_node_type, local_name, "#ff0000", local_id, config, local_generic_node_type);
                        };
                    })()
                },
                "console_link": (function() {
                    var region = id.split(":")[3];
                    return function() {
                        var html = `https://console.aws.amazon.com/systems-manager/managed-instances/${name}/description?region=${region}`;
                        return html;
                    };
                })(),
                "cloudwatch_link": (function() {
                    var region = id.split(":")[3];
                    return function() {
                        var html = `https://console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();query=~'*7bMSAM*2fSSMRunCommand*2c*22Instance*20ID*22*7d*20${name}`;
                        return html;
                    };
                })(),
                "generic_node_type": generic_node_type 
            };
            node_data.image.selected = node_data.render.normal_selected();
            node_data.image.unselected = node_data.render.normal_unselected();
            nodes.update(node_data);
        };


        var update = function() {
            return update_configs();
        };

        return {
            "name": "SSM Managed Instances",
            "update": update
        };
    });