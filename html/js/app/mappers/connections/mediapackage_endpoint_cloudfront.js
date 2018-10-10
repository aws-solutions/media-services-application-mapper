/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "levenshtein"], function($, model, lev) {

    var domain_lev_tolerance = 1;
    var path_lev_tolerance = 15;

    var update_connections = function() {
        var nodes = model.nodes;
        var edges = model.edges;
        return new Promise((resolve, reject) => {
            var cloudfront_arn_regex = /^arn\:aws\:cloudfront\:\:.*distribution.*/;
            var mediapackage_endpoint_arn_regex = /^arn\:aws\:mediapackage\:.*origin_endpoint.*/;
            for (var mp_endpoint_node of nodes.get()) {
                if (mediapackage_endpoint_arn_regex.test(mp_endpoint_node.id)) {
                    var mp_endpoint = mp_endpoint_node.data;
                    // special adjustment for CMAF endpoints with nested packaging
                    var mp_domain = new URL(mp_endpoint.Url || mp_endpoint.CmafPackage.HlsManifests[0].Url);
                    for (var cf_distro_node of nodes.get()) {
                        if (cloudfront_arn_regex.test(cf_distro_node.id)) {
                            var cf_distro = cf_distro_node.data;
                            for (var item of cf_distro.Origins.Items) {
                                var domain_lev = lev.get(item.DomainName, mp_domain.hostname);
                                var path_lev = lev.get(item.OriginPath, mp_domain.pathname);
                                if (domain_lev < domain_lev_tolerance && path_lev < path_lev_tolerance) {
                                    edges.update({
                                        "id": mp_endpoint_node.id + ":" + cf_distro_node.id,
                                        "from": mp_endpoint_node.id,
                                        "to": cf_distro_node.id,
                                        "arrows": "to",
                                        "label": mp_domain.protocol,
                                        "color": {
                                            "color": "black"
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
            resolve();
        });
    };

    var package_url = function(origin_endpoint) {

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
        "name": "MediaPackage Endpoints to CloudFront Distributions",
        "update": update
    };
});