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
            .get(url + "/cached/mediatailor-configuration", api_key)
            .then(function (configs) {
                for (let cache_entry of configs) {
                    map_config(cache_entry, items);
                }
                resolve(items);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const map_config = function (cache_entry, items) {
    const config = JSON.parse(cache_entry.data);
    const name = config.Name;
    const id = config.PlaybackConfigurationArn;
    const rgb = "#80e5ff";
    const node_type = "MediaTailor Configuration";
    const node_data = {
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
        data: config,
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
                    return svg_node.unselected(
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
                    return svg_node.selected(
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
                    return svg_node.unselected(
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
            const region = id.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/mediatailor/home?region=${region}#/config/${name}`;
            };
        })(),
        cloudwatch_link: (function () {
            const region = id.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#logs:prefix=MediaTailor`;
            };
        })(),
    };
    node_data.image.selected = node_data.render.normal_selected();
    node_data.image.unselected = node_data.render.normal_unselected();
    items.push(node_data);
};

export const module_name = "MediaTailor Configurations";
