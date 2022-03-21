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
        server.get(url + "/cached/ssm-managed-instance", api_key).then(function (configs) {
            for (let cache_entry of configs) {
                // console.log(cache_entry);
                map_config(cache_entry, items);
            }
            resolve(items);
        }).catch(function (error) {
            console.error(error);
            reject(error);
        });
    });
};

const map_config = function (cache_entry, items) {
    const config = JSON.parse(cache_entry.data);
    const name = config.Id;
    const id = cache_entry.arn;
    const rgb = "#D5DBDB";
    const generic_node_type = "SSM Managed Instance";
    let node_type = generic_node_type;
    if ('Tags' in config) {
        if ('MSAM-NodeType' in config.Tags) {
            node_type = config.Tags['MSAM-NodeType'];
        }
    }
    const node_data = {
        "overlay": "informational",
        "cache_update": cache_entry.updated,
        "id": id,
        "region": cache_entry.region,
        "shape": "image",
        "image": {
            "unselected": null,
            "selected": null
        },
        "header": "<b>" + node_type + ":</b> " + name,
        "data": config,
        "title": node_type,
        "name": name,
        "size": 55,
        "render": {
            normal_unselected: (function () {
                const local_node_type = node_type;
                const local_name = name;
                const local_rgb = rgb;
                const local_id = id;
                const local_generic_node_type = generic_node_type;
                return function () {
                    return svg_node.unselected(local_node_type, local_name, local_rgb, local_id, config, local_generic_node_type);
                };
            })(),
            normal_selected: (function () {
                const local_node_type = node_type;
                const local_name = name;
                const local_rgb = rgb;
                const local_id = id;
                const local_generic_node_type = generic_node_type;
                return function () {
                    return svg_node.selected(local_node_type, local_name, local_rgb, local_id, config, local_generic_node_type);
                };
            })(),
            alert_unselected: (function () {
                const local_node_type = node_type;
                const local_name = name;
                const local_id = id;
                const local_generic_node_type = generic_node_type;
                return function () {
                    return svg_node.unselected(local_node_type, local_name, "#ff0000", local_id, config, local_generic_node_type);
                };
            })(),
            alert_selected: (function () {
                const local_node_type = node_type;
                const local_name = name;
                const local_id = id;
                const local_generic_node_type = generic_node_type;
                return function () {
                    return svg_node.selected(local_node_type, local_name, "#ff0000", local_id, config, local_generic_node_type);
                };
            })()
        },
        "console_link": (function () {
            const region = id.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/systems-manager/managed-instances/${name}/description?region=${region}`;
            };
        })(),
        "cloudwatch_link": (function () {
            const region = id.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();query=~'*7bMSAM*2fSSMRunCommand*2c*22Instance*20ID*22*7d*20${name}`;
            };
        })(),
        "generic_node_type": generic_node_type
    };
    node_data.image.selected = node_data.render.normal_selected();
    node_data.image.unselected = node_data.render.normal_unselected();
    items.push(node_data);
};


export const module_name = "SSM Managed Instances";
