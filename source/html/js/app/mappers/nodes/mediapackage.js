/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../../server.js";
import * as connections from "../../connections.js";
import * as svg_node from "../../ui/svg_node.js";

const update_channels = function (items) {
    const local_svg_node = svg_node;
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const node_type = "MediaPackage Channel";
    const rgb = "#007DBC";
    return new Promise((resolve, reject) => {
        server
            .get(url + "/cached/mediapackage-channel", api_key)
            .then((channels) => {
                for (let cache_entry of channels) {
                    const channel = JSON.parse(cache_entry.data);
                    const name = channel.Id;
                    const id = channel.Arn;
                    const node_data = {
                        cache_update: cache_entry.updated,
                        id: channel.Arn,
                        region: cache_entry.region,
                        shape: "image",
                        image: {
                            unselected: null,
                            selected: null,
                        },
                        header: "<b>MediaPackage Channel:</b> " + channel.Id,
                        data: channel,
                        title: "MediaPackage Channel",
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
                            const local_id = channel.Id;
                            const local_region = channel.Arn.split(":")[3];
                            return function () {
                                return `https://console.aws.amazon.com/mediapackage/home?region=${local_region}#/channels/${local_id}`;
                            };
                        })(),
                        cloudwatch_link: (function () {
                            const local_id = channel.Id;
                            const local_region = channel.Arn.split(":")[3];
                            return function () {
                                return `https://console.aws.amazon.com/cloudwatch/home?region=${local_region}#metricsV2:graph=~();search=${local_id};namespace=AWS/MediaPackage;dimensions=Channel`;
                            };
                        })(),
                    };
                    node_data.image.selected =
                        node_data.render.normal_selected();
                    node_data.image.unselected =
                        node_data.render.normal_unselected();
                    items.push(node_data);
                }
                resolve();
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const update_endpoints = function (items) {
    const local_svg_node = svg_node;
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const node_type = "MediaPackage Endpoint";
    const rgb = "#00A1C9";
    return new Promise((resolve, reject) => {
        server
            .get(url + "/cached/mediapackage-origin-endpoint", api_key)
            .then((origin_endpoints) => {
                for (let cache_entry of origin_endpoints) {
                    const endpoint = JSON.parse(cache_entry.data);
                    const name = endpoint.Id;
                    const id = endpoint.Arn;
                    const node_data = {
                        cache_update: cache_entry.updated,
                        id: id,
                        region: cache_entry.region,
                        shape: "image",
                        image: {
                            unselected: null,
                            selected: null,
                        },
                        header: "<b>MediaPackage Endpoint:</b> " + endpoint.Id,
                        data: endpoint,
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
                            const local_id = endpoint.Id;
                            const parent_id = endpoint.ChannelId;
                            const local_region = endpoint.Arn.split(":")[3];
                            return function () {
                                return `https://console.aws.amazon.com/mediapackage/home?region=${local_region}#/channels/${parent_id}/endpoints/${local_id}`;
                            };
                        })(),
                        cloudwatch_link: (function () {
                            const local_id = endpoint.Id;
                            const local_region = endpoint.Arn.split(":")[3];
                            return function () {
                                return `https://console.aws.amazon.com/cloudwatch/home?region=${local_region}#metricsV2:graph=~();search=${local_id};namespace=AWS/MediaPackage;dimensions=Channel,OriginEndpoint`;
                            };
                        })(),
                    };
                    node_data.image.selected =
                        node_data.render.normal_selected();
                    node_data.image.unselected =
                        node_data.render.normal_unselected();
                    items.push(node_data);
                }
                resolve();
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

export const update = function () {
    const items = [];
    return new Promise((resolve, reject) => {
        Promise.all([update_channels(items), update_endpoints(items)])
            .then(() => {
                resolve(items);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

export const module_name = "MediaPackage Channels and Endpoints";
