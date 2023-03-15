/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "./server.js";
import * as connections from "./connections.js";
import * as mappers from "./mappers/mappers.js";

const nodes = new vis.DataSet();
const edges = new vis.DataSet();

const reset = function () {
    nodes.clear();
    edges.clear();
};

const map = function (callback) {
    new Promise(function (resolve) {
        let promises = [];
        for (let mapper of mappers.nodes) {
            console.log(mapper.module_name);
            promises.push(mapper.update());
            Promise.all(promises).then(function (resolved_values) {
                for (let items of resolved_values) {
                    nodes.update(items);
                }
                resolve();
            });
        }
    })
        .then(function () {
            let promises = [];
            for (let mapper of mappers.connections) {
                console.log(mapper.module_name);
                promises.push(mapper.update());
            }
            Promise.all(promises).then(function (resolved_values) {
                for (let items of resolved_values) {
                    edges.update(items);
                }
                for (let node of nodes.get()) {
                    // add stringified tags to the node, will be used during search
                    node.stringtags = JSON.stringify(node.data.Tags);
                    nodes.update(node);
                }
                if (typeof callback !== "undefined") {
                    callback();
                }
            });
        })
        .catch((error) => {
            console.error(error);
        });
};

const put_records = function (record) {
    let current = connections.get_current();
    let url = current[0];
    let api_key = current[1];
    let current_endpoint = `${url}/cached`;
    if (record && !Array.isArray(record)) {
        record = [record];
    }
    return new Promise(function (resolve, reject) {
        server
            .post(current_endpoint, api_key, record)
            .then(function (response) {
                console.log(response);
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const delete_record = function (arn) {
    let current = connections.get_current();
    let url = current[0];
    let api_key = current[1];
    let current_endpoint = `${url}/cached/arn/${encodeURIComponent(arn)}`;
    return new Promise(function (resolve, reject) {
        server
            .delete_method(current_endpoint, api_key)
            .then(function (response) {
                console.log(response);
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

// clear the model at module definition
reset();

export { nodes, edges, reset, map, put_records, delete_record };
