/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model"], function($, model) {

    var name = "Cross Region Service Check";

    var run_tool = function() {
        return new Promise(function(resolve, reject) {
            var row_num = 1;
            var rows = "";
            for (var edge of model.edges.get()) {
                var node_from = model.nodes.get(edge.from);
                var node_to = model.nodes.get(edge.to);
                if (node_from && node_to) {
                    var region_from = node_from.id.split(":")[3];
                    var region_to = node_to.id.split(":")[3];
                    if (region_from != "" && region_to != "") {
                        if (region_from != region_to) {
                            var row = `
                                <tr>
                                    <th scope="row">${row_num}</th>
                                    <td>${node_from.id}</td>
                                    <td>${node_to.id}</td>
                                </tr>
                                `;
                            rows += row;
                            row_num += 1;
                        }
                    }
                }
            }
            var table;
            if (rows.length > 0) {
                table = `
                    <small><table class="table table-bordered my-2">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">From</th>
                                <th scope="col">To</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${rows}
                        </tbody>
                    </table></small>
                    `;
            } else {
                table = `<p class="my-2"><span class="badge badge-success">Success</span> No resources were found with connections that cross regions.</p>`;
            }
            var html = `
            <p class="my-2">This tool checks the nodes at each end of a connection for different AWS region names. It will warn if a connection between services crosses regions.</p>
            ${table}
            `;
            resolve({
                name: name,
                success: (rows.length == 0),
                message: html
            });
        });
    };

    return {
        "name": name,
        "run": run_tool,
        "requires_single_selection": true,
        "requires_multi_selection": false,
        "selection_id_regex": ".*"
    };
});