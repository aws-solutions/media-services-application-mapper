/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model"], function($, model) {

    var packageMatch = /^(.+)Package$/;

    var update_connections = function() {
        var nodes = model.nodes;
        var edges = model.edges;
        return new Promise((resolve, reject) => {
            var mediapackage_channel_arn_regex = /^arn\:aws\:mediapackage\:.*\:channels\/.*/;
            var mediapackage_endpoint_arn_regex = /^arn\:aws\:mediapackage\:.*\:origin_endpoints\/.*/;
            $.each(nodes.getIds(), function(index, channel_arn) {
                if (mediapackage_channel_arn_regex.test(channel_arn)) {
                    var channel_node = nodes.get(channel_arn);
                    var mp_channel = channel_node.data;
                    $.each(nodes.getIds(), function(index, endpoint_arn) {
                        if (mediapackage_endpoint_arn_regex.test(endpoint_arn)) {
                            var endpoint_node = nodes.get(endpoint_arn);
                            var mp_endpoint = endpoint_node.data;
                            var channel_region = channel_node.id.split(":")[3];
                            var endpoint_region = endpoint_node.id.split(":")[3];
                            if (mp_endpoint.ChannelId == mp_channel.Id && channel_region == endpoint_region) {
                                var label = "";
                                Object.keys(mp_endpoint).forEach(function(value, index) {
                                    var match = packageMatch.exec(value);
                                    if (match) {
                                        label = match[1].toUpperCase();
                                    }
                                });
                                var id = mp_channel.Arn + ":" + mp_endpoint.Arn;
                                if (edges.get(id) == null) {
                                    edges.update({
                                        "id": id,
                                        "to": mp_endpoint.Arn,
                                        "from": mp_channel.Arn,
                                        "arrows": "to",
                                        "label": label,
                                        "color": {
                                            "color": "black"
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
            });
            resolve();
        });
    };

    var update = function() {
        return new Promise((resolve, reject) => {
            update_connections().then(function() {
                resolve();
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    }

    return {
        "name": "MediaPackage Channel to Endpoint Connections",
        "update": update
    };
});