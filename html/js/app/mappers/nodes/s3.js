/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/model", "app/ui/svg_node"], function($, server, connections, model, svg_node) {

    var update_buckets = function() {
        var current = connections.get_current();
        var url = current[0];
        var api_key = current[1];
        var nodes = model.nodes;
        var rgb = "#D5DBDB";
        var node_type = "S3 Bucket";
        return new Promise(function(resolve, reject) {
            var channels;
            server.get(url + "/cached/s3/global", api_key).then(function(cache_entries) {
                $.each(cache_entries, function(index, cache_entry) {
                    var bucket = JSON.parse(cache_entry.data);
                    bucket.Arn = "arn:aws:s3:::" + bucket.Name;
                    var name = bucket.Name;
                    var id = bucket.Arn;
                    var node_data = {
                        "cache_update": cache_entry.updated,
                        "id": bucket.Arn,
                        "shape": "image",
                        "image": {
                            "unselected": null,
                            "selected": null
                        },
                        "header": "<b>S3 Bucket:</b> " + name,
                        "data": bucket,
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
                            var id = bucket.Name;
                            return function() {
                                var html = `https://s3.console.aws.amazon.com/s3/buckets/${id}/?tab=overview`;
                                return html;
                            };
                        })(),
                        "cloudwatch_link": (function() {
                            var id = bucket.Name;
                            return function() {
                                var html = `https://console.aws.amazon.com/cloudwatch/home#metricsV2:graph=~();search=${id};namespace=AWS/S3;dimensions=BucketName,StorageType`;
                                return html;
                            };
                        })()
                    };
                    node_data.image.selected = node_data.render.normal_selected();
                    node_data.image.unselected = node_data.render.normal_unselected();
                    nodes.update(node_data);
                });
                resolve();
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var update = function() {
        return update_buckets();
    };

    return {
        "name": "S3 Buckets",
        "update": update
    };
});