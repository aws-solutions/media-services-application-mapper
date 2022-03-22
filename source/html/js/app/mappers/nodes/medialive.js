/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../../server.js";
import * as connections from "../../connections.js";
import * as svg_node from "../../ui/svg_node.js";

const node_map_handler = (node_type, name, rgb, id, selected, data) => {
    const local_id = id;
    const local_rgb = rgb;
    const local_name = name;
    const local_node_type = node_type;
    const method = selected ? "selected" : "unselected";
    return () =>
        svg_node[method](
            local_node_type,
            local_name,
            local_rgb,
            local_id,
            data
        );
};

const update_channels = function (items) {
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    return new Promise(function (resolve, reject) {
        server
            .get(`${url}/cached/medialive-channel`, api_key)
            .then(function (channels) {
                for (let cache_entry of channels) {
                    map_channel(cache_entry, items);
                }
                resolve();
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const update_inputs = function (items) {
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    return new Promise((resolve, reject) => {
        server
            .get(`${url}/cached/medialive-input`, api_key)
            .then((inputs) => {
                for (let cache_entry of inputs) {
                    map_input(cache_entry, items);
                }
                resolve();
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const update_multiplexes = function (items) {
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    return new Promise((resolve, reject) => {
        server
            .get(`${url}/cached/medialive-multiplex`, api_key)
            .then((inputs) => {
                for (let cache_entry of inputs) {
                    map_multiplex(cache_entry, items);
                }
                resolve();
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const update_link_devices = function (items) {
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    return new Promise((resolve, reject) => {
        server
            .get(`${url}/cached/link-device`, api_key)
            .then((devices) => {
                for (let cache_entry of devices) {
                    map_device(cache_entry, items);
                }
                resolve();
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const map_channel = function (cache_entry, items) {
    const channel = JSON.parse(cache_entry.data);

    // console.log('Channel: %o', channel);

    const name = channel.Name;
    const id = channel.Arn;
    const rgb = "#1E8900";
    const degraded_rgb = svg_node.getDegradedRgb();
    const node_type = "MediaLive Channel";
    let node_data = {
        cache_update: cache_entry.updated,
        id: id,
        region: cache_entry.region,
        shape: "image",
        image: {
            unselected: null,
            selected: null,
        },
        header: `<b>${node_type}:</b> ${name}`,
        data: channel,
        title: node_type,
        name: name,
        size: 55,
        render: {
            normal_unselected: (() =>
                node_map_handler(node_type, name, rgb, id, false, channel))(),
            normal_selected: (() =>
                node_map_handler(node_type, name, rgb, id, true, channel))(),
            alert_unselected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    "#ff0000",
                    id,
                    false,
                    channel
                ))(),
            alert_selected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    "#ff0000",
                    id,
                    true,
                    channel
                ))(),
            degraded_unselected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    degraded_rgb,
                    id,
                    false,
                    channel
                ))(),
            degraded_selected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    degraded_rgb,
                    id,
                    true,
                    channel
                ))(),
        },
        console_link: (function () {
            const id = channel.Id;
            const region = channel.Arn.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/medialive/home?region=${region}#!/channels/${id}`;
            };
        })(),
        alerts_link: (function () {
            const id = channel.Id;
            const region = channel.Arn.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/medialive/home?region=${region}#!/channels/${id}/alerts`;
            };
        })(),
        cloudwatch_link: (function () {
            const id = channel.Id;
            const region = channel.Arn.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();search=${id};namespace=MediaLive;dimensions=ChannelId,Pipeline`;
            };
        })(),
    };
    node_data.image.selected = node_data.render.normal_selected();
    node_data.image.unselected = node_data.render.normal_unselected();
    items.push(node_data);
};

const map_input = function (cache_entry, items) {
    const input = JSON.parse(cache_entry.data);

    // console.log('Input: %o', input);

    const name = input.Name;
    const id = input.Arn;
    const node_type = "MediaLive Input";
    const rgb = "#6AAF35";
    const degraded_rgb = svg_node.getDegradedRgb();
    let node_data = {
        cache_update: cache_entry.updated,
        id: input.Arn,
        region: cache_entry.region,
        shape: "image",
        image: {
            unselected: null,
            selected: null,
        },
        header: `<b>${node_type}:</b> ${name}`,
        data: input,
        title: node_type,
        name: name,
        size: 55,
        render: {
            normal_unselected: (() =>
                node_map_handler(node_type, name, rgb, id, false, input))(),
            normal_selected: (() =>
                node_map_handler(node_type, name, rgb, id, true, input))(),
            alert_unselected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    "#ff0000",
                    id,
                    false,
                    input
                ))(),
            alert_selected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    "#ff0000",
                    id,
                    true,
                    input
                ))(),
            degraded_unselected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    degraded_rgb,
                    id,
                    false,
                    input
                ))(),
            degraded_selected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    degraded_rgb,
                    id,
                    true,
                    input
                ))(),
        },
        console_link: (function () {
            const id = input.Id;
            const region = input.Arn.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/medialive/home?region=${region}#!/inputs/${id}`;
            };
        })(),
        cloudwatch_link: (function () {
            return function () {
                return `https://console.aws.amazon.com/cloudwatch/home`;
            };
        })(),
    };
    node_data.image.selected = node_data.render.normal_selected();
    node_data.image.unselected = node_data.render.normal_unselected();
    items.push(node_data);
};

const map_multiplex = function (cache_entry, items) {
    const input = JSON.parse(cache_entry.data);

    // console.log('Input: %o', input);

    const name = input.Name;
    const id = input.Arn;
    const node_type = "MediaLive Multiplex";
    const rgb = "#6a8258";
    const degraded_rgb = svg_node.getDegradedRgb();
    let node_data = {
        cache_update: cache_entry.updated,
        id: input.Arn,
        region: cache_entry.region,
        shape: "image",
        image: {
            unselected: null,
            selected: null,
        },
        header: `<b>${node_type}:</b> ${name}`,
        data: input,
        title: node_type,
        name: name,
        size: 55,
        render: {
            normal_unselected: (() =>
                node_map_handler(node_type, name, rgb, id, false, input))(),
            normal_selected: (() =>
                node_map_handler(node_type, name, rgb, id, true, input))(),
            alert_unselected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    "#ff0000",
                    id,
                    false,
                    input
                ))(),
            alert_selected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    "#ff0000",
                    id,
                    true,
                    input
                ))(),
            degraded_unselected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    degraded_rgb,
                    id,
                    false,
                    input
                ))(),
            degraded_selected: (() =>
                node_map_handler(
                    node_type,
                    name,
                    degraded_rgb,
                    id,
                    true,
                    input
                ))(),
        },
        console_link: (function () {
            const id = input.Id;
            const region = input.Arn.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/medialive/multiplex?region=${region}#/${id}`;
            };
        })(),
        alerts_link: (function () {
            const id = input.Id;
            const region = input.Arn.split(":")[3];
            return function () {
                return `https://console.aws.amazon.com/medialive/multiplex?region=${region}#/${id}/alerts`;
            };
        })(),
        cloudwatch_link: (function () {
            return function () {
                return "https://console.aws.amazon.com/cloudwatch/home";
            };
        })(),
    };
    node_data.image.selected = node_data.render.normal_selected();
    node_data.image.unselected = node_data.render.normal_unselected();
    items.push(node_data);
};

const map_device = function (cache_entry, items) {
    const device = JSON.parse(cache_entry.data);
    const name = device.Id;
    const id = cache_entry.arn;
    const rgb = "#D5DBDB";
    const node_type = "Elemental Link";
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
        data: device,
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
                return `https://${region}.console.aws.amazon.com/medialive/home?region=${region}#!/devices/${name}`;
            };
        })(),
        cloudwatch_link: (function () {
            return function () {
                return "https://console.aws.amazon.com/cloudwatch/";
            };
        })(),
    };
    node_data.image.selected = node_data.render.normal_selected();
    node_data.image.unselected = node_data.render.normal_unselected();
    items.push(node_data);
};

export const update = () => {
    const items = [];
    return new Promise((resolve, reject) => {
        Promise.all([
            update_channels(items),
            update_inputs(items),
            update_multiplexes(items),
            update_link_devices(items),
        ])
            .then(() => {
                resolve(items);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

export const module_name =
    "MediaLive Inputs, Channels, Multiplexes, Elemental Link";
