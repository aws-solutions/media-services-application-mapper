/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model"], function($, model) {

    var update_connections = function() {
        var nodes = model.nodes;
        var edges = model.edges;
        return new Promise((resolve, reject) => {
            var cloudfront_regexp_list = [
                /\:\/\/(\S+\.cloudfront\.net)\/.*/
            ]
            var medialive_arn_regex = /.*medialive.*input.*/;
            var cloudfront_arn_regex = /.*cloudfront.*distribution.*/;
            for (var ml_arn of nodes.getIds()) {
                if (medialive_arn_regex.test(ml_arn)) {
                    var ml_node = nodes.get(ml_arn);
                    var ml_input = ml_node.data;
                    for (var source of ml_input.Sources) {
                        var url = source.Url;
                        for (var re of cloudfront_regexp_list) {
                            var match = re.exec(url);
                            if (match) {
                                var domain_name = match[1];
                                // look for the distribution 
                                $.each(nodes.getIds(), (index, value) => {
                                    if (cloudfront_arn_regex.test(value)) {
                                        var cf_node = nodes.get(value);
                                        if (cf_node.data.DomainName == domain_name) {
                                            // connect these nodes
                                            var id = value + ":" + ml_node.id;
                                            if (null == edges.get(id)) {
                                                var protocol = new URL(url).protocol;
                                                edges.add({
                                                    "id": value + ":" + ml_node.id,
                                                    "from": value,
                                                    "to": ml_node.id,
                                                    "arrows": "to",
                                                    "label": protocol,
                                                    "color": {
                                                        "color": "black"
                                                    }
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            }
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
        "name": "CloudFront Distribution to MediaLive Input",
        "update": update
    };
});