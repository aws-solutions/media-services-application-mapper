/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/regions", "app/model", "app/ui/svg_node"], function($, server, connections, region_promise, model, svg_node) {

    var update_channels = function(regionName) {
        var current = connections.get_current();
        var url = current[0];
        var api_key = current[1];
        return new Promise(function(resolve, reject) {
            server.get(url + "/cached/medialive-channel/" + regionName, api_key).then(function(channels) {
                $.each(channels, function(index, cache_entry) {
                    map_channel(cache_entry);
                });
                resolve();
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var update_inputs = function(regionName) {
        var current = connections.get_current();
        var url = current[0];
        var api_key = current[1];
        return new Promise((resolve, reject) => {
            server.get(url + "/cached/medialive-input/" + regionName, api_key).then((inputs) => {
                $.each(inputs, function(index, cache_entry) {
                    map_input(cache_entry);
                });
                resolve();
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var map_channel = function(cache_entry) {
        var channel = JSON.parse(cache_entry.data);
        var name = channel.Name;
        var id = channel.Arn;
        var nodes = model.nodes;
        var rgb = "#1E8900";
        var node_type = "MediaLive Channel";
        var node_data = {
            "cache_update": cache_entry.updated,
            "id": id,
            "shape": "image",
            "image": {
                "unselected": null,
                "selected": null
            },
            "header": "<b>" + node_type + ":</b> " + name,
            "data": channel,
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
                var id = channel.Id;
                var region = channel.Arn.split(":")[3];
                return function() {
                    var html = `https://console.aws.amazon.com/medialive/home?region=${region}#/channels/${id}`;
                    return html;
                };
            })(),
            "cloudwatch_link": (function() {
                var id = channel.Id;
                var region = channel.Arn.split(":")[3];
                return function() {
                    var html = `https://console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();search=${id};namespace=MediaLive;dimensions=ChannelId,Pipeline`;
                    return html;
                };
            })()
        };
        node_data.image.selected = node_data.render.normal_selected();
        node_data.image.unselected = node_data.render.normal_unselected();
        nodes.update(node_data);
    };

    var map_input = function(cache_entry) {
        var input = JSON.parse(cache_entry.data);
        var name = input.Name;
        var id = input.Arn;
        var nodes = model.nodes;
        var node_type = "MediaLive Input";
        var rgb = "#6AAF35";
        var node_data = {
            "cache_update": cache_entry.updated,
            "id": input.Arn,
            "shape": "image",
            "image": {
                "unselected": null,
                "selected": null
            },
            "header": "<b>" + node_type + ":</b> " + name,
            "data": input,
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
                var id = input.Id;
                var region = input.Arn.split(":")[3];
                return function() {
                    var html = `https://console.aws.amazon.com/medialive/home?region=${region}#/inputs/${id}`;
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
    };

    var update = function() {
        return new Promise((resolve, reject) => {
            region_promise().then(function(regions) {
                var promises = [];
                $.each(regions.get_selected(), function(index, regionName) {
                    promises.push(update_channels(regionName));
                    promises.push(update_inputs(regionName));
                });
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
        "name": "MediaLive Inputs and Channels",
        "arn_matches": {
            ".+medialive.+channel.+": map_channel,
            ".+medialive.+input.+": map_input
        },
        "update": update
    };
});