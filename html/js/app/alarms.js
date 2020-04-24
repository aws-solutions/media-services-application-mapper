/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["lodash", "app/server", "app/connections", "app/settings"],
    function(_, server, connections, settings) {

        var listeners = [];

        // cache alarms in 'set' state
        // several modules use this at the same time

        var current_subscribers_with_alarms = [];
        var previous_subscribers_with_alarms = [];

        // interval in millis to update the cache

        var update_interval;

        var intervalID;

        var settings_key = "app-alarm-update-interval";

        var subscribers_with_alarm_state = function(state) {
            var current_connection = connections.get_current();
            var url = current_connection[0];
            var api_key = current_connection[1];
            var current_endpoint = `${url}/cloudwatch/alarms/${state}/subscribers`;
            return new Promise(function(resolve, reject) {
                server.get(current_endpoint, api_key).then(function(response) {
                    // console.log(response);
                    resolve(response);
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };


        var all_alarms_for_region = function(region) {
            var current_connection = connections.get_current();
            var url = current_connection[0];
            var api_key = current_connection[1];
            region = encodeURIComponent(region);
            var current_endpoint = `${url}/cloudwatch/alarms/all/${region}`;
            return new Promise(function(resolve, reject) {
                server.get(current_endpoint, api_key).then(function(response) {
                    // console.log(response);
                    resolve(response);
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        var alarms_for_subscriber = _.memoize(function(arn) {
            var current_connection = connections.get_current();
            var url = current_connection[0];
            var api_key = current_connection[1];
            arn = encodeURIComponent(arn);
            var current_endpoint = `${url}/cloudwatch/alarms/subscriber/${arn}`;
            return new Promise(function(resolve, reject) {
                server.get(current_endpoint, api_key).then(function(response) {
                    resolve(response);
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        });

        var subscribe_to_alarm = function(region, alarm_name, resource_arns) {
            var current_connection = connections.get_current();
            var url = current_connection[0];
            var api_key = current_connection[1];
            alarm_name = encodeURIComponent(alarm_name);
            var current_endpoint = `${url}/cloudwatch/alarm/${alarm_name}/region/${region}/subscribe`;
            return new Promise(function(resolve, reject) {
                server.post(current_endpoint, api_key, resource_arns).then(function(response) {
                    // console.log(response);
                    clear_function_cache();
                    resolve(response);
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        var unsubscribe_from_alarm = function(region, alarm_name, resource_arns) {
            console.log(region, alarm_name, resource_arns);
            var current_connection = connections.get_current();
            var url = current_connection[0];
            var api_key = current_connection[1];
            alarm_name = encodeURIComponent(alarm_name);
            var current_endpoint = `${url}/cloudwatch/alarm/${alarm_name}/region/${region}/unsubscribe`;
            return new Promise(function(resolve, reject) {
                server.post(current_endpoint, api_key, resource_arns).then(function(response) {
                    console.log(response);
                    clear_function_cache();
                    resolve(response);
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        var clear_function_cache = function() {
            alarms_for_subscriber.cache.clear();
        };

        var cache_update = function() {
            subscribers_with_alarm_state("ALARM").then(function(response) {
                // console.log("updated set event cache");
                previous_subscribers_with_alarms = current_subscribers_with_alarms;
                current_subscribers_with_alarms = _.sortBy(response, "ResourceArn");
                var added = _.differenceBy(current_subscribers_with_alarms, previous_subscribers_with_alarms, "ResourceArn");
                var removed = _.differenceBy(previous_subscribers_with_alarms, current_subscribers_with_alarms, "ResourceArn");
                if (added.length || removed.length) {
                    alarms_for_subscriber.cache.clear();
                    for (let f of listeners) {
                        f(current_subscribers_with_alarms, previous_subscribers_with_alarms);
                    }
                }
                // }
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
            console.log("alarms: interval scheduled " + update_interval + "ms");
        };

        load_update_interval();

        return {
            "get_subscribers_with_alarms": function() {
                return {
                    "current": current_subscribers_with_alarms,
                    "previous": previous_subscribers_with_alarms
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
            "all_alarms_for_region": all_alarms_for_region,
            "subscribe_to_alarm": subscribe_to_alarm,
            "unsubscribe_from_alarm": unsubscribe_from_alarm,
            "alarms_for_subscriber": alarms_for_subscriber,
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