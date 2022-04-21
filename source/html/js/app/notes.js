/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "./server.js";
import * as connections from "./connections.js";

const get_resource_notes = function (arn) {
    var current_connection = connections.get_current();
    var url = current_connection[0];
    var api_key = current_connection[1];
    var current_endpoint = `${url}/notes/${encodeURIComponent(arn)}`;
    return new Promise(function (resolve, reject) {
        server
            .get(current_endpoint, api_key)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const get_all_resource_notes = function () {
    var current_connection = connections.get_current();
    var url = current_connection[0];
    var api_key = current_connection[1];
    var current_endpoint = `${url}/notes`;
    return new Promise(function (resolve, reject) {
        server
            .get(current_endpoint, api_key)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const update_resource_notes = function (arn, notes) {
    var current_connection = connections.get_current();
    var url = current_connection[0];
    var api_key = current_connection[1];
    var current_endpoint = `${url}/notes/${encodeURIComponent(arn)}`;
    return new Promise(function (resolve, reject) {
        server
            .post(current_endpoint, api_key, notes)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const delete_resource_notes = function(arn) {
    var current_connection = connections.get_current();
    var url = current_connection[0];
    var api_key = current_connection[1];
    var current_endpoint = `${url}/notes/${encodeURIComponent(arn)}`;
    return new Promise(function (resolve, reject) {
        server
            .delete_method(current_endpoint, api_key)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

export {
    get_resource_notes,
    get_all_resource_notes,
    update_resource_notes,
    delete_resource_notes
};
