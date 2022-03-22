/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "./server.js";
import * as connections from "./connections.js";

const get_setting = _.memoize(function (id) {
    // get the current connection data
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    // create the resource url
    const current_endpoint = `${url}/settings/${id}`;
    // return a promise that response with result
    return new Promise((resolve, reject) => {
        server.get(current_endpoint, api_key).then((response) => {
            resolve(response);
        }).catch(function (error) {
            console.error(error);
            reject(error);
        });
    });
});

const put_setting = function (id, value) {
    // get the current connection data
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    // create the resource url
    const current_endpoint = `${url}/settings/${id}`;
    return new Promise((resolve, reject) => {
        const data = value;
        server.post(current_endpoint, api_key, data).then((response) => {
            clear_function_cache();
            resolve(response);
        }).catch(function (error) {
            console.error(error);
            reject(error);
        });
    });
};

const remove_setting = function (id) {
    // get the current connection data
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    // create the resource url
    const current_endpoint = `${url}/settings/${id}`;
    return new Promise((resolve, reject) => {
        server.delete_method(current_endpoint, api_key).then((response) => {
            clear_function_cache();
            resolve(response);
        }).catch(function (error) {
            console.error(error);
            reject(error);
        });
    });
};

const clear_function_cache = function () {
    get_setting.cache.clear();
};

export {
    get_setting as get,
    put_setting as put,
    remove_setting as remove
};
