/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../server.js";
import * as connections from "../connections.js";
import * as alert from "./alert.js";

var retrieve_layout = function (diagram) {
    var current_connection = connections.get_current();
    var url = current_connection[0];
    var api_key = current_connection[1];
    var current_endpoint = `${url}/layout/view/${encodeURIComponent(
        diagram.view_id
    )}`;
    return server.get(current_endpoint, api_key);
};

var delete_layout = function (diagram, node_ids) {
    node_ids = node_ids || diagram.nodes.getIds();
    alert.show("Deleting layout");
    var current_connection = connections.get_current();
    var url = current_connection[0];
    var api_key = current_connection[1];
    for (let node_id of node_ids) {
        var current_endpoint = `${url}/layout/nodes/${encodeURIComponent(
            diagram.view_id
        )}/${encodeURIComponent(node_id)}`;
        server.delete_method(current_endpoint, api_key);
    }
};

var save_layout = function (diagram, node_ids) {
    node_ids = node_ids || diagram.nodes.getIds();
    alert.show("Saving layout");
    var network = diagram.network;
    var positions = network.getPositions(node_ids);
    var layout = [];
    for (let key of Object.keys(positions)) {
        var entry = {
            view: diagram.view_id,
            id: key,
            x: positions[key].x,
            y: positions[key].y,
        };
        layout.push(entry);
    }
    var current_connection = connections.get_current();
    var url = current_connection[0];
    var api_key = current_connection[1];
    var current_endpoint = `${url}/layout/nodes`;
    server
        .post(current_endpoint, api_key, layout)
        .then(function () {
            alert.show("Layout saved");
            console.log("layout changes are saved");
        })
        .catch(function (error) {
            console.error(error);
        });
};

function delete_all() {
    var current_connection = connections.get_current();
    var url = current_connection[0];
    var api_key = current_connection[1];
    var current_endpoint = `${url}/layout/views`;
    return new Promise((resolve, reject) => {
        server
            .delete_method(current_endpoint, api_key)
            .then((response) => {
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
}

export { retrieve_layout, delete_layout, save_layout, delete_all };
