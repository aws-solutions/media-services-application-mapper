/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/api_check", "app/build", "app/connections"],
    function($, check, build, connections) {

        var name = "MSAM Build Numbers";

        // one week tolerance for stamp differences
        var tolerance = 3600 * 7 * 24;

        var run_tool = function() {
            return new Promise(function(resolve, reject) {
                var current_connection = connections.get_current();
                var endpoint = current_connection[0];
                var api_key = current_connection[1];
                var app_stamp = build.get_version();
                check.ping(endpoint, api_key).then(function(response) {
                var message = `
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
                        name: name,
                        success: true,
                        message: message
                    });
                }).catch(function(event) {
                    resolve({
                        name: name,
                        success: false,
                        message: "Error encountered: " + event
                    });
                });
            });
        };

        return {
            "name": name,
            "run": run_tool,
            "requires_single_selection": false,
            "requires_multi_selection": false,
            "selection_id_regex": ".*"
        };
    });