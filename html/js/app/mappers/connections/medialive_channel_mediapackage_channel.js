/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/server", "app/connections"],
    function($, _, model, server, connections) {

        const update_connections = () => {
            const current = connections.get_current();
            const url = current[0];
            const api_key = current[1];

            return new Promise((resolve, reject) => {
                server.get(`${url}/cached/medialive-channel-mediapackage-channel/global`, api_key).then((connections) => {
                    for (let connection of connections) {
                        const data = JSON.parse(connection.data);
                        const options = {
                            id: connection.arn,
                            to: connection.to,
                            from: connection.from,
                            data: data,
                            label: 'HLS',
                            arrows: "to",
                            color: { color: "black" },
                            dashes: false,
                        };
                        const hasMoreConnections = _.filter(connections, function(o) {
                            if (o.from === connection.from && o.to === connection.to) {
                                let shouldEndWith = '0';
                                if (connection.arn.endsWith('0'))
                                    shouldEndWith = '1';
                                if (o.arn.endsWith(shouldEndWith))
                                    return true;
                            }
                            return false;
                        });

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

        const update = () => new Promise((resolve, reject) => {
            update_connections()
                .then(resolve)
                .catch(error => {
                    console.log(error);
                    reject(error);
                });
        });

        return { name: 'MediaLive Channel to MediaPackage Channel', update };
    });