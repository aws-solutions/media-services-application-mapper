/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "app/ui/svg_node"], function($, model, svg_node) {

    /*
    This module technically adds a new kind of node, but it depends on the 
    MediaPackage node mapper to be complete. This module runs with the connectors 
    to be sure all MediaPackage inventory is loaded first.
    */

    var mediapackage_speke = function() {
        var nodes = model.nodes;
        var edges = model.edges;
        return new Promise((resolve, reject) => {
            var mediapackage_endpoint_arn_regex = /^arn\:aws\:mediapackage\:.*endpoint.*/;
            var node_type = "SPEKE Keyserver";
            var rgb = "#cc00ff";
            for (var mp_endpoint_node of nodes.get()) {
                if (mediapackage_endpoint_arn_regex.test(mp_endpoint_node.id)) {
                    var region = mp_endpoint_node.id.split(":")[3];
                    var account = mp_endpoint_node.id.split(":")[4];
                    var mp_endpoint = mp_endpoint_node.data;
                    if ("HlsPackage" in mp_endpoint && "Encryption" in mp_endpoint.HlsPackage && "SpekeKeyProvider" in mp_endpoint.HlsPackage.Encryption) {
                        var url = new URL(mp_endpoint.HlsPackage.Encryption.SpekeKeyProvider.Url);
                        var id = "arn:oss:speke:" + region + ":" + account + ":" + url.hostname;
                        var name = url.hostname;
                        var node_data = {
                            "cache_update": 0,
                            "id": id,
                            "shape": "image",
                            "image": {
                                "unselected": null,
                                "selected": null
                            },
                            "header": "<b>SPEKE Keyserver:</b> " + url.hostname,
                            "data": mp_endpoint.HlsPackage.Encryption.SpekeKeyProvider.Url,
                            "title": "SPEKE Keyserver",
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
                                var id = mp_endpoint.Id;
                                var parent_id = mp_endpoint.ChannelId;
                                var region = mp_endpoint.Arn.split(":")[3];
                                return function() {
                                    var html = `https://console.aws.amazon.com/mediapackage/home?region=${region}#/channels/${parent_id}/endpoints/${id}`;
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
                        edges.update({
                            "id": mp_endpoint_node.id + ":" + id,
                            "from": mp_endpoint_node.id,
                            "to": id,
                            "arrows": "to",
                            "label": url.protocol,
                            "color": {
                                "color": "black"
                            }
                        });
                    }
                }
            }
            resolve();
        });
    };

    var update = function() {
        return new Promise((resolve, reject) => {
            mediapackage_speke().then(function() {
                resolve();
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    return {
        "name": "SPEKE Keyservers",
        "update": update
    };
});