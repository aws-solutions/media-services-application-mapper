/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "./server.js";
import * as connections from "./connections.js";
import * as settings from "./settings.js";

let listeners = [];

// cache events in 'set' state
// several modules use this at the same time

let current_set_events = []; // superset of all alert events
let previous_set_events = [];
let current_mediaconnect_events = [];
let previous_mediaconnect_events = [];
let current_medialive_events = [];
let previous_medialive_events = [];

// interval in millis to update the cache

let update_interval;

let intervalID;

let settings_key = "app-event-update-interval";

// or does this have to be union of eml and emx sets??
let retrieve_for_state = function (state) {
let current_connection = connections.get_current();
let url = current_connection[0];
let api_key = current_connection[1];
let current_endpoint = `${url}/cloudwatch/events/state/${state}`;
    return new Promise(function (resolve, reject) {
        server
            .get(current_endpoint, api_key)
            .then(resolve)
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

let cache_update = function () {
    retrieve_for_state("set")
        .then(function (response) {
            previous_set_events = current_set_events;
            current_set_events = response;
            previous_medialive_events = _.filter(
                previous_set_events,
                function (i) {
                    return i.source == "aws.medialive";
                }
            );
            current_medialive_events = _.filter(
                current_set_events,
                function (i) {
                    return i.source == "aws.medialive";
                }
            );
            previous_mediaconnect_events = _.filter(
                previous_set_events,
                function (i) {
                    return i.source == "aws.mediaconnect";
                }
            );
            current_mediaconnect_events = _.filter(
                current_set_events,
                function (i) {
                    return i.source == "aws.mediaconnect";
                }
            );
            let added = _.differenceBy(
                current_set_events,
                previous_set_events,
                "alarm_id"
            );
            let removed = _.differenceBy(
                previous_set_events,
                current_set_events,
                "alarm_id"
            );
            if (added.length || removed.length) {
                for (let f of listeners) {
                    f(current_set_events, previous_set_events);
                }
            }
        })
        .catch(function (error) {
            console.error(error);
        });
};

let load_update_interval = function () {
    return new Promise(function (resolve) {
        settings.get(settings_key).then(function (value) {
            let seconds = Number.parseInt(value);
            update_interval = seconds * 1000;
            resolve();
        });
    });
};

let set_update_interval_setting = function (seconds) {
    // create a default
    update_interval = seconds * 1000;
    return settings.put(settings_key, seconds);
};

let schedule_interval = function () {
    if (intervalID) {
        clearInterval(intervalID);
    }
    intervalID = setInterval(cache_update, update_interval);
    console.log("events: interval scheduled " + update_interval + "ms");
};

export function deferred_init() {
    load_update_interval().then(function(){
        schedule_interval()
    });
}

export function get_cached_events() {
    return {
        current: current_set_events,
        previous: previous_set_events,
        current_mediaconnect: current_mediaconnect_events,
        previous_mediaconnect: previous_mediaconnect_events,
        current_medialive: current_medialive_events,
        previous_medialive: previous_medialive_events,
    };
}

export function add_callback(f) {
    if (!listeners.includes(f)) {
        listeners.push(f);
    }
    // schedule the interval only when there's at least 1 listener
    if (!intervalID && update_interval) {
        schedule_interval();
    }
}

export function set_update_interval(seconds) {
    set_update_interval_setting(seconds).then(function () {
        if (intervalID) {
            schedule_interval();
        }
    });
}

export function get_update_interval() {
    return update_interval;
}
