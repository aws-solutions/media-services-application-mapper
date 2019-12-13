/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/model", "app/ui/svg_node"],
    function($, server, connections, model, svg_node) {

        var color = "#D5DBDB";
        var update_distributions = function() {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            var nodes = model.nodes;
            var rgb = "#D5DBDB";
            var node_type = "CloudFront Distribution";
            return new Promise((resolve, reject) => {
                server.get(url + "/cached/cloudfront-distribution/global", api_key).then((cache_entries) => {
                    for (let cache_entry of cache_entries) {
                        var item = JSON.parse(cache_entry.data);
                        var name = item.Id;
                        var id = item.ARN;
                        var node_data = {
                            "cache_update": cache_entry.updated,
                            "id": id,
                            "region": cache_entry.region,
                            "shape": "image",
                            "image": {
                                "unselected": svg_node.unselected(node_type, name, rgb, id),
                                "selected": svg_node.selected(node_type, name, rgb, id)
                            },
                            "header": "<b>CloudFront Distribution:</b> " + name,
                            "data": item,
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
                                var id = item.Id;
                                var region = item.ARN.split(":")[3];
                                if (region.trim().length == 0) {
                                    region = 'us-east-1';
                                }
                                return function() {
                                    var html = `https://console.aws.amazon.com/cloudfront/home?region=${region}#distribution-settings:${id}`;
                                    return html;
                                };
                            })(),
                            "cloudwatch_link": (function() {
                                var id = item.Id;
                                var region = item.ARN.split(":")[3];
                                if (region.trim().length == 0) {
                                    region = 'us-east-1';
                                }
                                return function() {
                                    var html = `https://console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();search=${id};namespace=AWS/CloudFront;dimensions=DistributionId,Region`;
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
            "name": "CloudFront Distributions",
            "get_color": color,
            "set_color": function(new_color) {
                color = new_color;
            },
            "update": update
        };
    });