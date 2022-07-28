/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../../server.js";
import * as connections from "../../connections.js";
import * as svg_node from "../../ui/svg_node.js";

export const update = function () {
    const local_svg_node = svg_node;
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const rgb = "#D5DBDB";
    const node_type = "CloudFront Distribution";
    const items = [];
    return new Promise((resolve, reject) => {
        server
            .get(url + "/cached/cloudfront-distribution", api_key)
            .then(async (cache_entries) => {
                for (let cache_entry of cache_entries) {
                    const item = JSON.parse(cache_entry.data);
                    const name = item.Id;
                    const id = item.ARN;
                    const node_data = {
                        cache_update: cache_entry.updated,
                        id: id,
                        region: cache_entry.region,
                        shape: "image",
                        image: {
                            unselected: null,
                            selected: null,
                        },
                        header: "<b>CloudFront Distribution:</b> " + name,
                        data: item,
                        title: node_type,
                        name: name,
                        size: 55,
                        render: {
                            normal_unselected: (function () {
                                const local_node_type = node_type;
                                const local_name = name;
                                const local_rgb = rgb;
                                const local_id = id;
                                return function () {
                                    return local_svg_node.unselected(
                                        local_node_type,
                                        local_name,
                                        local_rgb,
                                        local_id
                                    );
                                };
                            })(),
                            normal_selected: (function () {
                                const local_node_type = node_type;
                                const local_name = name;
                                const local_rgb = rgb;
                                const local_id = id;
                                return function () {
                                    return local_svg_node.selected(
                                        local_node_type,
                                        local_name,
                                        local_rgb,
                                        local_id
                                    );
                                };
                            })(),
                            alert_unselected: (function () {
                                const local_node_type = node_type;
                                const local_name = name;
                                const local_id = id;
                                return function () {
                                    return local_svg_node.unselected(
                                        local_node_type,
                                        local_name,
                                        "#ff0000",
                                        local_id
                                    );
                                };
                            })(),
                            alert_selected: (function () {
                                const local_node_type = node_type;
                                const local_name = name;
                                const local_id = id;
                                return function () {
                                    return local_svg_node.selected(
                                        local_node_type,
                                        local_name,
                                        "#ff0000",
                                        local_id
                                    );
                                };
                            })(),
                        },
                        console_link: (function () {
                            const local_id = item.Id;
                            let region = item.ARN.split(":")[3];
                            if (region.trim().length == 0) {
                                region = "us-east-1";
                            }
                            return function () {
                                return `https://console.aws.amazon.com/cloudfront/home?region=${region}#distribution-settings:${local_id}`;
                            };
                        })(),
                        cloudwatch_link: (function () {
                            const local_id = item.Id;
                            let region = item.ARN.split(":")[3];
                            if (region.trim().length == 0) {
                                region = "us-east-1";
                            }
                            return function () {
                                return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();search=${local_id};namespace=AWS/CloudFront;dimensions=DistributionId,Region`;
                            };
                        })(),
                    };
                    node_data.image.selected =
                        node_data.render.normal_selected();
                    node_data.image.unselected =
                        node_data.render.normal_unselected();
                    items.push(node_data);
                }
                resolve(items);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

export const module_name = "CloudFront Distributions";
