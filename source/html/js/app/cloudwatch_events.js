/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "./server.js";
import * as connections from "./connections.js";

export function get_cloudwatch_events(arn) {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    const current_endpoint = `${url}/cloudwatch/events/all/${encodeURIComponent(
        arn
    )}`;
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
}
