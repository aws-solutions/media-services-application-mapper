/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["app/server", "app/connections", "app/settings"],
    function(server, connections, settings) {

        var listeners = [];

        // cache events in 'set' state
        // several modules use this at the same time

        var current_set_events = [];
        var previous_set_events = [];

        // interval in millis to update the cache

        var update_interval;

        var intervalID;

        var settings_key = "app-event-update-interval";

        var retrieve_for_state = function(state) {
            var current_connection = connections.get_current();
            var url = current_connection[0];
            var api_key = current_connection[1];
            var current_endpoint = `${url}/cloudwatch/events/state/${state}`;
            return new Promise(function(resolve, reject) {
                server.get(current_endpoint, api_key).then(function(response) {
                    resolve(response);
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        var cache_update = function() {
            retrieve_for_state("set").then(function(response) {
                // console.log("updated set event cache");
                previous_set_events = current_set_events;
                current_set_events = response;
                listeners.forEach(function(f) {
                    f(current_set_events, previous_set_events);
                });
            }).catch(function(error) {
                console.log(error);
            });
        };

        var load_update_interval = function() {
            return new Promise(function(resolve, reject) {
                settings.get(settings_key).then(function(value) {
                    seconds = Number.parseInt(value);
                    update_interval = seconds * 1000;
                    resolve();
                });
            });
        };

        var set_update_interval = function(seconds) {
            // create a default
            update_interval = seconds * 1000;
            return settings.put(settings_key, seconds);
        };

        var schedule_interval = function() {
            if (intervalID) {
                clearInterval(intervalID);
            }
            intervalID = setInterval(cache_update, update_interval);
            console.log("events: interval scheduled " + update_interval + "ms");
        };

        load_update_interval().then(function() {
            schedule_interval();
        });

        return {
            "get_cached_events": function() {
                return {
                    "current": current_set_events,
                    "previous": previous_set_events
                };
            },
            "add_listener": function(f) {
                if (!listeners.includes(f)) {
                    listeners.push(f);
                }
            },
            "set_update_interval": function(seconds) {
                set_update_interval(seconds).then(function() {
                    schedule_interval();
                });
            },
            "get_update_interval": function() {
                return update_interval;
            }
        };

    });