/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../server.js";
import * as connections from "../connections.js";
import * as alert from "./alert.js";

const retrieve_layout = function (diagram) {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    const current_endpoint = `${url}/layout/view/${encodeURIComponent(
        diagram.view_id
    )}`;
    return server.get(current_endpoint, api_key);
};

const delete_layout = function (diagram, node_ids) {
    node_ids = node_ids || diagram.nodes.getIds();
    alert.show("Deleting layout");
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    for (const node_id of node_ids) {
        const current_endpoint = `${url}/layout/nodes/${encodeURIComponent(
            diagram.view_id
        )}/${encodeURIComponent(node_id)}`;
        server.delete_method(current_endpoint, api_key);
    }
};

const save_layout = function (diagram, node_ids) {
    node_ids = node_ids || diagram.nodes.getIds();
    alert.show("Saving layout");
    const network = diagram.network;
    const positions = network.getPositions(node_ids);
    const layout = [];
    for (const key of Object.keys(positions)) {
        const entry = {
            view: diagram.view_id,
            id: key,
            x: positions[key].x,
            y: positions[key].y,
        };
        layout.push(entry);
    }
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    const current_endpoint = `${url}/layout/nodes`;
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
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    const current_endpoint = `${url}/layout/views`;
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
