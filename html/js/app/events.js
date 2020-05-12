/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["app/server", "app/connections", "app/settings"],
    function(server, connections, settings) {

        var listeners = [];

        // cache events in 'set' state
        // several modules use this at the same time

        var current_set_events = []; // superset of all alert events
        var previous_set_events = [];
        var current_mediaconnect_events = [];
        var previous_mediaconnect_events = [];
        var current_medialive_events = [];
        var previous_medialive_events = [];

        // interval in millis to update the cache

        var update_interval;

        var intervalID;

        var settings_key = "app-event-update-interval";

        // or does this have to be union of eml and emx sets??
        var retrieve_for_state = function(state) {
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

        var retrieve_for_state_source = function(state, source) {
            var current_connection = connections.get_current();
            var url = current_connection[0];
            var api_key = current_connection[1];
            if (source == "aws.medialive"){
                var current_endpoint = `${url}/cloudwatch/events/state/${state}/groups`;
            }
            else {
                var current_endpoint = `${url}/cloudwatch/events/state/${state}/${source}`;
            }
            return new Promise(function(resolve, reject) {
                server.get(current_endpoint, api_key)
                    .then(resolve)
                    .catch(function(error) {
                        console.log(error);
                        reject(error);
                    });
            });
        };

        var cache_update = function() {
            retrieve_for_state("set").then(function(res) {
                // console.log("updated set event cache");
                console.log('retrieve for all set state');
                console.log(res);
                previous_set_events = current_set_events;
                current_set_events = res;
                var added = _.differenceBy(current_set_events, previous_set_events, "alarm_id");
                var removed = _.differenceBy(previous_set_events, current_set_events, "alarm_id");
                if (added.length || removed.length) {
                    for (let f of listeners) {
                        f(current_set_events, previous_set_events);
                    }
                }
            }).catch(function(error) {
                console.log(error);
            });

            // for all medialive in set state, this includes multiplex
            retrieve_for_state_source("set", "aws.medialive").then(function(res) {
                previous_medialive_events = current_medialive_events;
                current_medialive_events = res.degraded.concat(res.down).concat(res.running);
                console.log("retrieve_for_state_source medialive");
                console.log(res);
                var added = _.differenceBy(current_medialive_events, previous_medialive_events, "alarm_id");
                var removed = _.differenceBy(previous_medialive_events, current_medialive_events, "alarm_id");
                if (added.length || removed.length) {
                    for (let f of listeners) {
                        f(current_medialive_events, previous_medialive_events);
                    }
                }
            }).catch(function(error) {
                console.log(error);
            });

            retrieve_for_state_source("set", "aws.mediaconnect").then(function(res) {
                previous_mediaconnect_events = current_mediaconnect_events;
                current_mediaconnect_events = res;
                console.log("retrieve_for_state_source mediaconnect");
                console.log(res);
                var added = _.differenceBy(current_mediaconnect_events, previous_mediaconnect_events, "alarm_id");
                var removed = _.differenceBy(previous_mediaconnect_events, current_mediaconnect_events, "alarm_id");
                if (added.length || removed.length) {
                    for (let f of listeners) {
                        f(current_mediaconnect_events, previous_mediaconnect_events);
                    }
                }
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

        // load_update_interval().then(function() {
        //     schedule_interval();
        // });

        load_update_interval();

        return {
            "get_cached_events": function() {
                return {
                    "current": current_set_events,
                    "previous": previous_set_events,
                    "current_mediaconnect": current_mediaconnect_events,
                    "previous_mediaconnect": previous_mediaconnect_events,
                    "current_medialive": current_medialive_events,
                    "previous_medialive": previous_medialive_events
                };
            },
            "add_callback": function(f) {
                if (!listeners.includes(f)) {
                    listeners.push(f);
                }
                if (!intervalID) {
                    schedule_interval();
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