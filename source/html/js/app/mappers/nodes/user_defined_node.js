/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// {
//     "arn": "arn:msam:user-defined-node:global:<ACCOUNT>:<GUID>",
//     "data": "{ "NodeType": "Elemental Live Encoder", "Id": "mktlivelab-4.elementalad.com" }",
//     "expires": 1535857826,
//     "region": "global",
//     "service": "user-defined-node",
//     "updated": 1535850626
// }

import * as server from "../../server.js";
import * as connections from "../../connections.js";
import * as svg_node from "../../ui/svg_node.js";

export const update = function () {
    const local_svg_node = svg_node;
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const items = [];
    return new Promise((resolve, reject) => {
        server
            .get(url + "/cached/user-defined-node", api_key)
            .then((cache_entries) => {
                for (const cache_entry of cache_entries) {
                    let color = "#D5DBDB";
                    const item = JSON.parse(cache_entry.data);
                    const name = item.Id;
                    if (cache_entry.color) {
                        color = cache_entry.color;
                    }
                    const local_color = color;
                    const node_type = item.NodeType;
                    const id = cache_entry.arn;
                    const node_data = {
                        cache_update: cache_entry.updated,
                        id: id,
                        region: cache_entry.region,
                        shape: "image",
                        image: {
                            unselected: null,
                            selected: null,
                        },
                        header: "<b>" + node_type + ":</b> " + name,
                        data: item,
                        title: node_type,
                        name: name,
                        size: 55,
                        render: {
                            normal_unselected: (function () {
                                const local_node_type = node_type;
                                const local_name = name;
                                const local_id = id;
                                return function () {
                                    return local_svg_node.unselected(
                                        local_node_type,
                                        local_name,
                                        local_color,
                                        local_id
                                    );
                                };
                            })(),
                            normal_selected: (function () {
                                const local_node_type = node_type;
                                const local_name = name;
                                const local_id = id;
                                return function () {
                                    return local_svg_node.selected(
                                        local_node_type,
                                        local_name,
                                        local_color,
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
                                return "#";
                            };
                        })(),
                        cloudwatch_link: (function () {
                            return function () {
                                return "#";
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

export const module_name = "User-Defined Nodes";
