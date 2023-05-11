/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// {
//     "arn": "<FROM-ARN>:<TO-ARN>",
//     "expires": 1535860952,
//     "from": "<FROM-ARN>",
//     "region": "global",
//     "service": "user-defined-node-interconnect",
//     "to": "<TO-ARN>",
//     "updated": 1535853752
// }

import * as server from "../../server.js";
import * as connections from "../../connections.js";

// vis.js edge roundness from 0.0 - 1.0
// 1.0 is a semicircle
const curvature_increment = 0.15;

function getOptionSmoothType(index, previous_from, connection) {
    // alternating counter-clockwise and clockwise curve
    if (index % 2 == 0) {
        // first of the pair uses clockwise
        return "curvedCW";
    } else {
        // second of the pair might change direction
        if (
            previous_from &&
            connection.from === previous_from
        ) {
            // same direction, use counterclockwise
            return "curvedCCW";
        } else {
            // opposite direction, use clockwise
            return "curvedCW";
        }
    }
}

function groupEdgeNodes(results) {
    return _.reduce(
        results,
        function (result, connection) {
            let id;
            if (connection.to > connection.from) {
                id = `${connection.from}:${connection.to}`;
            } else {
                id = `${connection.to}:${connection.from}`;
            }
            (result[id] || (result[id] = [])).push(connection);
            return result;
        },
        {}
    );
}

export const update = function () {
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const items = [];
    return new Promise((resolve) => {
        server
            .get(url + "/cached/user-defined-connection", api_key)
            .then((results) => {
                // group edges between nodes regardless of direction
                const edge_groups = groupEdgeNodes(results);
                // iterate through each grouping to create the correct curvature and prevent overlap
                _.forEach(edge_groups, function (value) {
                    // order the grouped connections by to, from and label
                    const ordered_connections = _.orderBy(value, ["from", "to", "label"]);
                    let previous_from;
                    for (const index in ordered_connections) {
                        const connection = ordered_connections[index];
                        let data;
                        // data attribute is not required on custom connections
                        if (typeof connection.data == "undefined") {
                            data = {};
                        } else {
                            data = JSON.parse(connection.data);
                        }
                        //  connection options for vis.js
                        const options = {
                            id: connection.arn,
                            to: connection.to,
                            from: connection.from,
                            label: connection.label,
                            data: data,
                            arrows: "to",
                            color: {
                                color: "black",
                            },
                        };
                        // more than one connection needs curving, otherwise defaults to straight
                        if (ordered_connections.length > 1) {
                            options.smooth = { enabled: true };
                            options.smooth.type = getOptionSmoothType(index, previous_from, connection);
                            // determine the curvature needed, expands every 2
                            options.smooth.roundness =
                                Math.floor(index / 2) * curvature_increment +
                                curvature_increment;
                        }
                        previous_from = connection.from;
                        items.push(options);
                    }
                });
                resolve(items);
            });
    });
};

export const module_name = "User-Defined Node Connections";
