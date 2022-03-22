/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as check from "../api_check.js";
import * as build from "../build.js";
import * as connections from "../connections.js";

const module_name = "MSAM Build Numbers";

const run_tool = function () {
    return new Promise(function (resolve) {
        const current_connection = connections.get_current();
        const endpoint = current_connection[0];
        const api_key = current_connection[1];
        const app_stamp = build.get_version();
        check
            .ping(endpoint, api_key)
            .then(function (response) {
                const message = `
                <p class="my-2">This tool shows the build numbers for the currently running browser application and the currently connected endpoint.</p>
                <table class="table table-bordered my-2">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Component</th>
                            <th scope="col">Build Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">1</th>
                            <td>Browser Application</td>
                            <td>${app_stamp}</td>
                        </tr>
                        <tr>
                            <th scope="row">2</th>
                            <td>Endpoint API</td>
                            <td>${response.version}</td>
                        </tr>
                    </tbody>
                </table>
                `;
                resolve({
                    name: module_name,
                    success: true,
                    message: message,
                });
            })
            .catch(function (event) {
                resolve({
                    name: module_name,
                    success: false,
                    message: "Error encountered: " + event,
                });
            });
    });
};

export { module_name as name, run_tool as run };

export const requires_single_selection = false;
export const requires_multi_selection = false;
export const selection_id_regex = ".*";
