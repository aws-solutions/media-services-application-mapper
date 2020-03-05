/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/server", "app/connections"],
    function($, _, model, server, connections) {

        var update_connections = function() {
            var current = connections.get_current();
            var url = current[0];
            var api_key = current[1];
            return new Promise((resolve, reject) => {
                server.get(url + "/cached/medialive-channel-mediapackage-channel/global", api_key).then((connections) => {
                    for (let connection of connections) {
                        var data = JSON.parse(connection.data);
                        var human_type = "HLS";
                        var smoothType = 'discrete';
                        if (_.has(data, "pipeline")) {
                            human_type += ` ${data.pipeline}`;
                            smoothType = data.pipeline === 1 ? 'curvedCCW' : 'curvedCW';
                        }
                        model.edges.update({
                            id: connection.arn,
                            to: connection.to,
                            from: connection.from,
                            data: data,
                            label: human_type,
                            arrows: "to",
                            color: {
                                color: "black"
                            },
                            smooth: {
                                enabled: true,
                                type: smoothType
                            }
                        });
                    }
                    resolve();
                });
            });
        }

        var update = function() {
            return new Promise((resolve, reject) => {
                update_connections().then(function() {
                    resolve();
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        }

        return {
            "name": "MediaLive Channel to MediaPackage Channel",
            "update": update
        };
    });