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
                        const smooth = { enabled: true, type: 'discrete' };
                        const { arn: id, to, from } = connection;
                        const arrows = 'to';
                        const color = { color: 'black' };
                        let label = 'HLS';

                        if (_.has(data, 'pipeline')) {
                            label += ` ${data.pipeline}`;
                            smooth.type = data.pipeline === 1 ? 'curvedCCW' : 'curvedCW';
                        }

                        model.edges.update({ id, to, from, data, label, smooth, arrows, color });
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