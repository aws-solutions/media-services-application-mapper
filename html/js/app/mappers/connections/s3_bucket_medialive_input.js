/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model"], function($, model) {

    var update_connections = function() {
        var nodes = model.nodes;
        var edges = model.edges;
        return new Promise((resolve, reject) => {
            var bucket_regexp_list = [
                /http\:\/\/(\S+)\.s3\-website.+/,
                /https\:\/\/s3\-\S+\.amazonaws\.com\/([^\/]+)\//,
                /https\:\/\/(\S+)\.s3\.amazonaws\.com\//
            ]
            var medialive_arn_regex = /.*medialive.*input.*/;
            $.each(nodes.getIds(), function(index, ml_arn) {
                if (medialive_arn_regex.test(ml_arn)) {
                    var ml_node = nodes.get(ml_arn);
                    var ml_input = ml_node.data;
                    $.each(ml_input.Sources, function(index, source) {
                        var url = source.Url;
                        $.each(bucket_regexp_list, function(index, re) {
                            var match = re.exec(url);
                            if (match) {
                                var input_bucket_name = match[1];
                                var bucket_arn = "arn:aws:s3:::" + input_bucket_name;
                                // find the bucket in our list
                                var bucket_node = nodes.get(bucket_arn);
                                // one of our buckets?
                                if (bucket_node != null) {
                                    var protocol = new URL(url).protocol;
                                    edges.update({
                                        "id": bucket_node.id + ":" + ml_node.id,
                                        "from": bucket_node.id,
                                        "to": ml_node.id,
                                        "arrows": "to",
                                        "label": protocol,
                                        "color": {
                                            "color": "black"
                                        }
                                    });
                                }
                                return false;
                            }
                        });
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
    };

    return {
        "name": "S3 Buckets to MediaLive Inputs",
        "update": update
    };
});