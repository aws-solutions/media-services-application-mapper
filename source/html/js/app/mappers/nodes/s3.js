/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/model", "app/ui/svg_node"],
    function($, server, connections, model, svg_node) {

        const update_buckets = function() {
            const local_svg_node = svg_node;
            const current = connections.get_current();
            const url = current[0];
            const api_key = current[1];
            const nodes = model.nodes;
            const rgb = "#D5DBDB";
            const node_type = "S3 Bucket";
            return new Promise(function(resolve, reject) {
                server.get(url + "/cached/s3", api_key).then(function(cache_entries) {
                    for (let cache_entry of cache_entries) {
                        const bucket = JSON.parse(cache_entry.data);
                        bucket.Arn = "arn:aws:s3:::" + bucket.Name;
                        const name = bucket.Name;
                        const id = bucket.Arn;
                        let node_data = {
                            "cache_update": cache_entry.updated,
                            "id": bucket.Arn,
                            "region": cache_entry.region,
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
                                    let local_node_type = node_type;
                                    let local_name = name;
                                    let local_rgb = rgb;
                                    let local_id = id;
                                    return function() {
                                        return local_svg_node.unselected(local_node_type, local_name, local_rgb, local_id);
                                    };
                                })(),
                                normal_selected: (function() {
                                    let local_node_type = node_type;
                                    let local_name = name;
                                    let local_rgb = rgb;
                                    let local_id = id;
                                    return function() {
                                        return local_svg_node.selected(local_node_type, local_name, local_rgb, local_id);
                                    };
                                })(),
                                alert_unselected: (function() {
                                    let local_node_type = node_type;
                                    let local_name = name;
                                    let local_id = id;
                                    return function() {
                                        return local_svg_node.unselected(local_node_type, local_name, "#ff0000", local_id);
                                    };
                                })(),
                                alert_selected: (function() {
                                    let local_node_type = node_type;
                                    let local_name = name;
                                    let local_id = id;
                                    return function() {
                                        return local_svg_node.selected(local_node_type, local_name, "#ff0000", local_id);
                                    };
                                })()
                            },
                            "console_link": (function() {
                                const id = bucket.Name;
                                return function() {
                                    let html = `https://s3.console.aws.amazon.com/s3/buckets/${id}/?tab=overview`;
                                    return html;
                                };
                            })(),
                            "cloudwatch_link": (function() {
                                const id = bucket.Name;
                                return function() {
                                    let html = `https://console.aws.amazon.com/cloudwatch/home#metricsV2:graph=~();search=${id};namespace=AWS/S3;dimensions=BucketName,StorageType`;
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

        const update = function() {
            return update_buckets();
        };

        return {
            "name": "S3 Buckets",
            "update": update
        };
    });