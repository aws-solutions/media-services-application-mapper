/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["app/server", "app/connections", "app/settings"], function(server, connections, settings) {

    var listeners = [];

    // cache alarms in 'set' state
    // several modules use this at the same time

    var current_subscribers_with_alarms = [];
    var previous_subscribers_with_alarms = [];

    var current_alarm_count = 0;
    var previous_alarm_count = 0;

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

    var alarms_for_subscriber = function(arn) {
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
    };

    var subscribe_to_alarm = function(region, alarm_name, resource_arns) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        alarm_name = encodeURIComponent(alarm_name);
        var current_endpoint = `${url}/cloudwatch/alarm/${alarm_name}/region/${region}/subscribe`;
        return new Promise(function(resolve, reject) {
            server.post(current_endpoint, api_key, resource_arns).then(function(response) {
                // console.log(response);
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var cache_update = function() {
        subscribers_with_alarm_state("ALARM").then(function(response) {
            // console.log("updated set event cache");
            previous_subscribers_with_alarms = current_subscribers_with_alarms;
            current_subscribers_with_alarms = response;
            previous_alarm_count = current_alarm_count;
            // only notify if current and previous are different
            current_alarm_count = 0;
            var matches = 0;
            current_subscribers_with_alarms.forEach(function(current) {
                current_alarm_count += current.AlarmCount;
                previous_subscribers_with_alarms.forEach(function(previous) {
                    if (previous.ResourceArn == current.ResourceArn) {
                        matches++;
                    }
                });
            });
            if (previous_subscribers_with_alarms.length != current_subscribers_with_alarms.length ||
                current_subscribers_with_alarms.length != matches ||
                previous_subscribers_with_alarms.length != matches ||
                previous_alarm_count != current_alarm_count) {
                listeners.forEach(function(f) {
                    f(current_subscribers_with_alarms, previous_subscribers_with_alarms);
                });
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
        console.log("alarms: interval scheduled " + update_interval + "ms");
    };

    load_update_interval().then(function() {
        schedule_interval();
    });

    return {
        "get_subscribers_with_alarms": function() {
            return {
                "current": current_subscribers_with_alarms,
                "previous": previous_subscribers_with_alarms
            };
        },
        "add_listener": function(f) {
            if (!listeners.includes(f)) {
                listeners.push(f);
            }
        },
        "all_alarms_for_region": all_alarms_for_region,
        "subscribe_to_alarm": subscribe_to_alarm,
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