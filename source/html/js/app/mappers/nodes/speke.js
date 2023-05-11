/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../../server.js";
import * as connections from "../../connections.js";
import * as svg_node from "../../ui/svg_node.js";

/*
This module technically adds a new kind of node, but it depends on the 
MediaPackage node mapper to be complete. This module runs with the connectors 
to be sure all MediaPackage inventory is loaded first.
*/

const node_type = "SPEKE Keyserver";

export const update = function () {
    const local_svg_node = svg_node;
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const rgb = "#cc00ff";
    const items = [];
    return new Promise((resolve, reject) => {
        server
            .get(url + "/cached/speke-keyserver", api_key)
            .then((speke_keyservers_cached) => {
                for (const keyserver of speke_keyservers_cached) {
                    const keyserver_data = JSON.parse(keyserver.data);
                    const name = keyserver_data.endpoint;
                    const id = keyserver.arn;
                    const node_data = {
                        cache_update: keyserver.updated,
                        id: id,
                        region: keyserver.region,
                        shape: "image",
                        image: {
                            unselected: null,
                            selected: null,
                        },
                        header:
                            "<b>" +
                            node_type +
                            ":</b> " +
                            keyserver_data.endpoint,
                        data: keyserver_data,
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
                            return function () {
                                return `https://console.aws.amazon.com/`;
                            };
                        })(),
                        cloudwatch_link: (function () {
                            return function () {
                                return `https://console.aws.amazon.com/`;
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

export const module_name = node_type + "s";
