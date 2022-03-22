/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../../server.js";
import * as connections from "../../connections.js";
import * as svg_node from "../../ui/svg_node.js";

export const update = function () {
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const items = [];
    return new Promise(function (resolve, reject) {
        server
            .get(url + "/cached/mediaconnect-flow", api_key)
            .then(function (flows) {
                for (let cache_entry of flows) {
                    // console.log(cache_entry);
                    map_flow(cache_entry, items);
                }
                resolve(items);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const map_flow = function (cache_entry, items) {
    const flow = JSON.parse(cache_entry.data);
    const name = flow.Name;
    const id = flow.FlowArn;
    const rgb = "#99ff33";
    const node_type = "MediaConnect Flow";
    let node_data = {
        overlay: "informational",
        cache_update: cache_entry.updated,
        id: id,
        region: cache_entry.region,
        shape: "image",
        image: {
            unselected: null,
            selected: null,
        },
        header: "<b>" + node_type + ":</b> " + name,
        data: flow,
        title: node_type,
        name: name,
        size: 55,
        render: {
            normal_unselected: (function () {
                let local_node_type = node_type;
                let local_name = name;
                let local_rgb = rgb;
                let local_id = id;
                return function () {
                    return svg_node.unselected(
                        local_node_type,
                        local_name,
                        local_rgb,
                        local_id
                    );
                };
            })(),
            normal_selected: (function () {
                let local_node_type = node_type;
                let local_name = name;
                let local_rgb = rgb;
                let local_id = id;
                return function () {
                    return svg_node.selected(
                        local_node_type,
                        local_name,
                        local_rgb,
                        local_id
                    );
                };
            })(),
            alert_unselected: (function () {
                let local_node_type = node_type;
                let local_name = name;
                let local_id = id;
                return function () {
                    return svg_node.unselected(
                        local_node_type,
                        local_name,
                        "#ff0000",
                        local_id
                    );
                };
            })(),
            alert_selected: (function () {
                let local_node_type = node_type;
                let local_name = name;
                let local_id = id;
                return function () {
                    return svg_node.selected(
                        local_node_type,
                        local_name,
                        "#ff0000",
                        local_id
                    );
                };
            })(),
        },
        console_link: (function () {
            let split_id = id.split(":");
            let region = split_id[3];
            return function () {
                return `https://${region}.console.aws.amazon.com/mediaconnect/home?region=${region}#/flows/${id}`;
            };
        })(),
        cloudwatch_link: (function () {
            let split_id = id.split(":");
            let region = split_id[3];
            let name = split_id[split_id.length - 1];
            return function () {
                return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();query=~'*7bAWS*2fMediaConnect*2cFlowARN*7d*20${name}`;
            };
        })(),
    };
    node_data.image.selected = node_data.render.normal_selected();
    node_data.image.unselected = node_data.render.normal_unselected();
    items.push(node_data);
};

export const module_name = "MediaConnect Flows";
