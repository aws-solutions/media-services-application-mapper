/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/regions", "app/model", "app/ui/svg_node"],
    function($, server, connections, region_promise, model, svg_node) {

        var update_channels = function(regionName) {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            var nodes = model.nodes;
            var node_type = "MediaPackage Channel";
            var rgb = "#007DBC";
            return new Promise((resolve, reject) => {
                server.get(url + "/cached/mediapackage-channel/" + regionName, api_key).then((channels) => {
                    for (let cache_entry of channels) {
                        var channel = JSON.parse(cache_entry.data);
                        var name = channel.Id;
                        var id = channel.Arn;
                        var node_data = {
                            "cache_update": cache_entry.updated,
                            "id": channel.Arn,
                            "region": cache_entry.region,
                            "shape": "image",
                            "image": {
                                "unselected": null,
                                "selected": null
                            },
                            "header": "<b>MediaPackage Channel:</b> " + channel.Id,
                            "data": channel,
                            "title": "MediaPackage Channel",
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
                                degraded_unselected: (function() {
                                    var local_node_type = node_type;
                                    var local_name = name;
                                    var local_id = id;
                                    return function() {
                                        return svg_node.unselected(local_node_type, local_name, "#ffcccc", local_id);
                                    };
                                })(),
                                degraded_selected: (function() {
                                    var local_node_type = node_type;
                                    var local_name = name;
                                    var local_id = id;
                                    return function() {
                                        return svg_node.selected(local_node_type, local_name, "#ffcccc", local_id);
                                    };
                                })()
                            },
                            "console_link": (function() {
                                var id = channel.Id;
                                var region = channel.Arn.split(":")[3];
                                return function() {
                                    var html = `https://console.aws.amazon.com/mediapackage/home?region=${region}#/channels/${id}`;
                                    return html;
                                };
                            })(),
                            "cloudwatch_link": (function() {
                                var id = channel.Id;
                                var region = channel.Arn.split(":")[3];
                                return function() {
                                    var html = `https://console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();search=${id};namespace=AWS/MediaPackage;dimensions=Channel`;
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

        var update_endpoints = function(regionName) {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            var nodes = model.nodes;
            var node_type = "MediaPackage Endpoint";
            var rgb = "#00A1C9";
            return new Promise((resolve, reject) => {
                server.get(url + "/cached/mediapackage-origin-endpoint/" + regionName, api_key).then((origin_endpoints) => {
                    for (let cache_entry of origin_endpoints) {
                        var endpoint = JSON.parse(cache_entry.data);
                        var name = endpoint.Id;
                        var id = endpoint.Arn;
                        var node_data = {
                            "cache_update": cache_entry.updated,
                            "id": id,
                            "region": cache_entry.region,
                            "shape": "image",
                            "image": {
                                "unselected": null,
                                "selected": null
                            },
                            "header": "<b>MediaPackage Endpoint:</b> " + endpoint.Id,
                            "data": endpoint,
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
                                degraded_unselected: (function() {
                                    var local_node_type = node_type;
                                    var local_name = name;
                                    var local_id = id;
                                    return function() {
                                        return svg_node.unselected(local_node_type, local_name, "#ffcccc", local_id);
                                    };
                                })(),
                                degraded_selected: (function() {
                                    var local_node_type = node_type;
                                    var local_name = name;
                                    var local_id = id;
                                    return function() {
                                        return svg_node.selected(local_node_type, local_name, "#ffcccc", local_id);
                                    };
                                })()
                            },
                            "console_link": (function() {
                                var id = endpoint.Id;
                                var parent_id = endpoint.ChannelId;
                                var region = endpoint.Arn.split(":")[3];
                                return function() {
                                    var html = `https://console.aws.amazon.com/mediapackage/home?region=${region}#/channels/${parent_id}/endpoints/${id}`;
                                    return html;
                                };
                            })(),
                            "cloudwatch_link": (function() {
                                var id = endpoint.Id;
                                var region = endpoint.Arn.split(":")[3];
                                return function() {
                                    var html = `https://console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();search=${id};namespace=AWS/MediaPackage;dimensions=Channel,OriginEndpoint`;
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
            return new Promise((resolve, reject) => {
                region_promise().then(function(regions) {
                    var promises = [];
                    for (let region_name of regions.get_selected()) {
                        promises.push(update_channels(region_name));
                        promises.push(update_endpoints(region_name));
                    }
                    Promise.all(promises).then(function() {
                        resolve();
                    })
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        return {
            "name": "MediaPackage Channels and Endpoints",
            "update": update
        };
    });