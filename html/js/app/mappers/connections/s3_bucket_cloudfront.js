/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model"], function($, model) {


    /*
        techmkt-live.s3.amazonaws.com
        hypercube-live.s3.amazonaws.com
            "Id": "Custom-s3-us-west-2.amazonaws.com/ibc2017-cmaf-assets-from-danger/BMW/EP1_BMW.m3u8",
                            "DomainName": "s3-us-west-2.amazonaws.com",
                            "OriginPath": "/ibc2017-cmaf-assets-from-danger/BMW/EP1_BMW.m3u8",
        speke-demos-keybucket-auszteqe4p90.s3-website-us-east-1.amazonaws.com

    */

    var s3_arn_regex = /^arn\:aws\:s3\:\:\:.*/;
    var cloudfront_arn_regex = /.*cloudfront.*distribution.*/;
    // var s3_origin_regex = /\S+\.s3([^\.]+)?\.amazonaws\.com/;
    var s3_origin_regex = /(\S+)\.s3\.amazonaws\.com/;

    var update_connections = function() {
        var nodes = model.nodes;
        var edges = model.edges;
        return new Promise((resolve, reject) => {
            var buckets = [];
            var distros = [];
            $.each(nodes.get(), function(bucket_index, bucket_value) {
                if (s3_arn_regex.test(bucket_value.id)) {
                    buckets.push(bucket_value);
                }
            });
            $.each(nodes.get(), function(cfront_index, cfront_value) {
                if (cloudfront_arn_regex.test(cfront_value.id)) {
                    distros.push(cfront_value);
                }
            });
            $.each(buckets, function(bucket_index, bucket_value) {
                var bucket = bucket_value.data;
                $.each(distros, function(cfront_index, cfront_value) {
                    var distribution = cfront_value.data;
                    $.each(distribution.Origins.Items, function(origin_item_index, origin_item_value) {
                        var match = s3_origin_regex.exec(origin_item_value.DomainName);
                        if (match) {
                            var bucket_name = match[1];
                            if (bucket_name === bucket.Name) {
                                edges.update({
                                    "id": bucket_value.id + ":" + cfront_value.id,
                                    "from": bucket_value.id,
                                    "to": cfront_value.id,
                                    "arrows": "to",
                                    "label": "S3",
                                    "color": {
                                        "color": "black"
                                    }
                                });
                            }
                        }
                    });
                });
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
        "name": "S3 Buckets to CloudFront Distributions",
        "update": update
    };
});