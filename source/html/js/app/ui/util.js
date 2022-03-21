/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

export var makeid = function (id_len = 10) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < id_len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

export function get_random_number(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

export function vary(value, limit) {
    return value + (get_random_number(limit) * (get_random_number(2) == 0 ? -1 : 1));
}

export var get_downstream = function (edges, node_id, connected_nodes) {
    var downstream_edges = edges.get({
        filter: function (item) {
            return item.from === node_id;
        }
    });
    for (let edge of downstream_edges) {
        if (!connected_nodes.includes(edge.to)) {
            connected_nodes.push(edge.to);
            get_downstream(edges, edge.to, connected_nodes);
        }
    }
};

export var get_upstream = function (edges, node_id, connected_nodes) {
    var upstream_edges = edges.get({
        filter: function (item) {
            return item.to === node_id;
        }
    });
    for (let edge of upstream_edges) {
        if (!connected_nodes.includes(edge.from)) {
            connected_nodes.push(edge.from);
            get_upstream(edges, edge.from, connected_nodes);
        }
    }
};

