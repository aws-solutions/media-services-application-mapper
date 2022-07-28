/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "./server.js";
import * as connections from "./connections.js";

let available = [];

const get_available = function () {
    return available;
};

export const refresh = _.memoize(function () {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    const all_endpoint = `${url}/regions`;
    return new Promise(function (resolve, reject) {
        server
            .get(all_endpoint, api_key)
            .then(function (data) {
                available = data;
                available.sort(function (a, b) {
                    const nameA = a.RegionName;
                    const nameB = b.RegionName;
                    if (nameA < nameB) {
                        return -1;
                    } else if (nameA > nameB) {
                        return 1;
                    } else {
                        // names must be equal
                        return 0;
                    }
                });
                const module = {
                    get_available: get_available,
                };
                resolve(module);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
});
