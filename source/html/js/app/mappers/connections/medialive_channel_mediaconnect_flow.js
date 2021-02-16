/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/server", "app/connections"],
    function($, _, model, server, connections) {

        const update_connections = () => {
            const current = connections.get_current();
            const url = current[0];
            const api_key = current[1];

            return new Promise((resolve, reject) => {
                server.get(`${url}/cached/medialive-channel-mediaconnect-flow`, api_key).then((connections) => {
                    for (let connection of connections) {
                        var data = JSON.parse(connection.data);
                        model.edges.update({
                            "id": connection.arn,
                            "to": connection.to,
                            "from": connection.from,
                            "data": data,
                            "label": data.scheme,
                            "arrows": "to",
                            "color": {
                                "color": "black"
                            },
                            dashes: false,
                        });
                    }
                    resolve();
                });
            });
        };

        const update = () => {
            return update_connections();
        };

        return { name: 'MediaLive Channel to MediaConnect Flow', update };
    });