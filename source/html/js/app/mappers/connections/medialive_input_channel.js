/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/server", "app/connections"],
    function($, _, model, server, connections) {

        var update_connections = function() {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            return new Promise((resolve, reject) => {
                server.get(url + "/cached/medialive-input-medialive-channel", api_key).then((connections) => {
                    for (let connection of connections) {
                        const data = JSON.parse(connection.data);
                        const options = {
                            id: connection.arn,
                            to: connection.to,
                            from: connection.from,
                            data: data,
                            label: data.type.replace(/\_/, " "),
                            arrows: "to",
                            color: { color: "black" },
                        };
                        const hasMoreConnections = _.filter(connections, (function(local_connection) {
                            return function(o) {
                                if (o.from === local_connection.from && o.to === local_connection.to) {
                                    let shouldEndWith = '0';
                                    if (local_connection.arn.endsWith('0'))
                                        shouldEndWith = '1';
                                    if (o.arn.endsWith(shouldEndWith))
                                        return true;
                                }
                                return false;
                            };
                        })(connection));

                        if (hasMoreConnections.length) {
                            /** curve it */
                            options.smooth = { enabled: true };
                            options.smooth.type = 'discrete';

                            if (_.has(data, "pipeline")) {
                                options.label += ` ${data.pipeline}`;
                                options.smooth.type = data.pipeline === 1 ? 'curvedCCW' : 'curvedCW';
                                options.smooth.roundness = 0.15;
                            }
                        }

                        model.edges.update(options);
                    }
                    resolve();
                });
            });
        };

        var update = function() {
            return update_connections();
        };

        return {
            "name": "MediaLive Input to Channel Connections",
            "update": update
        };
    });