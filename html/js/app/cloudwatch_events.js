/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["app/server", "app/connections"], function(server, connections) {

    var retrieve_for_state = function(state, arn) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/cloudwatch/events/state/${state}`;

        return new Promise(function(resolve, reject) {
            server.get(current_endpoint, api_key)
                .then(resolve)
                .catch(function(error) {
                    console.log(error);
                    reject(error);
                });
        });
    };

    var get_cloudwatch_events = function(arn) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        arn = encodeURIComponent(arn);
        var current_endpoint = `${url}/cloudwatch/events/all/${arn}`;

        return new Promise(function(resolve, reject) {
            server.get(current_endpoint, api_key)
                .then(resolve)
                .catch(reject);
        });
    };

    const get_cloudwatch_state_events = arn => new Promise((resolve, reject) => {
        let events = [];

        retrieve_for_state("set", arn)
            .then(res => {
                events = res.filter(e => e.resource_arn === arn);
                return retrieve_for_state("cleared", arn);
            })
            .then(res => {
                res.filter(e => e.resource_arn === arn).forEach(evt => {
                    if (!events.includes(evt)) {
                        events.push(evt);
                    }
                });

                resolve(events);
            })
            .catch(reject);
    });

    return {
        get_cloudwatch_events: get_cloudwatch_events,
        get_cloudwatch_state_events: get_cloudwatch_state_events
    };
});