/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../../server.js";
import * as connections from "../../connections.js";

export const update = () => {
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const items = [];
    return new Promise((resolve) => {
        const endpoint = `${url}/cached/medialive-channel-multiplex`;
        server.get(endpoint, api_key).then((connections) => {
            for (let connection of connections) {
                const data = JSON.parse(connection.data);
                const options = {
                    id: connection.arn,
                    to: connection.to,
                    from: connection.from,
                    data: data,
                    label: data.program,
                    arrows: "to",
                    color: { color: "black" },
                    dashes: false,
                };
                const shouldEndWith = connection.arn.endsWith("0") ? "1" : "0";
                const local_connection = connection;
                const hasMoreConnections = _.filter(connections, function (o) {
                    if (
                        o.from === local_connection.from &&
                        o.to === local_connection.to
                    ) {
                        if (o.arn.endsWith(shouldEndWith)) return true;
                    }
                    return false;
                });

                if (hasMoreConnections.length) {
                    /** curve it */
                    options.smooth = { enabled: true };
                    options.smooth.type = "discrete";

                    if (_.has(data, "pipeline")) {
                        options.label += ` ${data.pipeline}`;
                        options.smooth.type =
                            data.pipeline === 1 ? "curvedCCW" : "curvedCW";
                        options.smooth.roundness = 0.15;
                    }
                }
                items.push(options);
            }
            resolve(items);
        });
    });
};

export const module_name = "MediaLive Channel to Multiplex";
