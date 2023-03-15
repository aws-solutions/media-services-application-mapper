/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../server.js";
import * as connections from "../connections.js";
import * as alert from "./alert.js";

let retrieve_layout = function (diagram) {
    let current_connection = connections.get_current();
    let url = current_connection[0];
    let api_key = current_connection[1];
    let current_endpoint = `${url}/layout/view/${encodeURIComponent(
        diagram.view_id
    )}`;
    return server.get(current_endpoint, api_key);
};

let delete_layout = function (diagram, node_ids) {
    node_ids = node_ids || diagram.nodes.getIds();
    alert.show("Deleting layout");
    let current_connection = connections.get_current();
    let url = current_connection[0];
    let api_key = current_connection[1];
    for (let node_id of node_ids) {
        let current_endpoint = `${url}/layout/nodes/${encodeURIComponent(
            diagram.view_id
        )}/${encodeURIComponent(node_id)}`;
        server.delete_method(current_endpoint, api_key);
    }
};

let save_layout = function (diagram, node_ids) {
    node_ids = node_ids || diagram.nodes.getIds();
    alert.show("Saving layout");
    let network = diagram.network;
    let positions = network.getPositions(node_ids);
    let layout = [];
    for (let key of Object.keys(positions)) {
        let entry = {
            view: diagram.view_id,
            id: key,
            x: positions[key].x,
            y: positions[key].y,
        };
        layout.push(entry);
    }
    let current_connection = connections.get_current();
    let url = current_connection[0];
    let api_key = current_connection[1];
    let current_endpoint = `${url}/layout/nodes`;
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
    let current_connection = connections.get_current();
    let url = current_connection[0];
    let api_key = current_connection[1];
    let current_endpoint = `${url}/layout/views`;
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
