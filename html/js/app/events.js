/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(['app/server', 'app/connections', 'app/settings'], function(server, connections, settings) {
    const listeners = [];
    const settings_key = 'app-event-update-interval';
    // cache events in 'set' state
    // several modules use this at the same time
    let current_set_events = [];
    let previous_set_events = [];
    // interval in millis to update the cache
    let intervalID;
    let update_interval;

    const retrieve_for_state = function(state) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/cloudwatch/events/state/${state}/groups`;

        return new Promise(function(resolve, reject) {
            server.get(current_endpoint, api_key)
                .then(resolve)
                .catch(function(error) {
                    console.log(error);
                    reject(error);
                });
        });
    };

    const cache_update = function() {
        retrieve_for_state('set').then(function(res) {
            // console.log('updated set event cache');
            // console.log(res);
            previous_set_events = current_set_events;
            current_set_events = res.degraded.concat(res.down).concat(res.running);

            const added = _.differenceBy(current_set_events, previous_set_events, 'alarm_id');
            const removed = _.differenceBy(previous_set_events, current_set_events, 'alarm_id');
            
            if (added.length || removed.length) {
                for (let f of listeners) {
                    f(current_set_events, previous_set_events);
                }
            }
        }).catch(function(error) {
            console.log(error);
        });
    };

    const load_update_interval = function() {
        return new Promise(function(resolve, reject) {
            settings.get(settings_key).then(function(value) {
                seconds = Number.parseInt(value);
                update_interval = seconds * 1000;
                resolve();
            });
        });
    };

    const set_update_interval = function(seconds) {
        // create a default
        update_interval = seconds * 1000;
        return settings.put(settings_key, seconds);
    };

    const schedule_interval = function() {
        if (intervalID) clearInterval(intervalID);
        intervalID = setInterval(cache_update, update_interval);
        console.log(`events: interval scheduled ${update_interval} ms`);
    };

    load_update_interval();

    return {
        get_update_interval: () => update_interval,
        get_cached_events: () => ({ current: current_set_events, previous: previous_set_events }),
        add_callback: function(f) {
            if (!listeners.includes(f)) listeners.push(f);
            if (!intervalID) schedule_interval();
        },
        set_update_interval: function(seconds) {
            set_update_interval(seconds).then(function() {
                schedule_interval();
            });
        },
    };
});