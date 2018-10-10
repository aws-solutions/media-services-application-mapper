/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model"], function($, model) {

    var update_connections = function() {
        var nodes = model.nodes;
        var edges = model.edges;
        return new Promise((resolve, reject) => {
            var medialive_channel_arn_regex = /.*medialive.*channel.*/;
            var medialive_input_arn_regex = /.*medialive.*input.*/;
            $.each(nodes.getIds(), function(index, channel_arn) {
                if (medialive_channel_arn_regex.test(channel_arn)) {
                    var channel_node = nodes.get(channel_arn);
                    var ml_channel = channel_node.data;
                    $.each(nodes.getIds(), function(index, input_arn) {
                        if (medialive_input_arn_regex.test(input_arn)) {
                            var input_node = nodes.get(input_arn);
                            var ml_input = input_node.data;
                            $.each(ml_input.AttachedChannels, (i, attached) => {
                                if (attached == ml_channel.Id) {
                                    var id = ml_input.Arn + ":" + ml_channel.Arn;
                                    if (edges.get(id) == null) {
                                        edges.update({
                                            "id": id,
                                            "from": ml_input.Arn,
                                            "to": ml_channel.Arn,
                                            "arrows": "to",
                                            "color": {
                                                "color": "black"
                                            }
                                        })
                                    }
                                }
                            });
                        }
                    });
                }
            });
            resolve();
        });
    }

    var update = function() {
        return new Promise((resolve, reject) => {
            update_connections().then(function() {
                resolve();
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    return {
        "name": "MediaLive Input to Channel Connections",
        "update": update
    };
});