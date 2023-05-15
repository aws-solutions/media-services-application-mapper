/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "./server.js";
import * as connections from "./connections.js";
import * as settings from "./settings.js";

const listeners = [];

const region_cache_clear_interval_ms = 60000;

// cache alarms in 'set' state
// several modules use this at the same time

let current_subscribers_with_alarms = [];
let previous_subscribers_with_alarms = [];

// interval in millis to update the cache

let update_interval;

let intervalID;

const settings_key = "app-alarm-update-interval";

const server_get = (endpoint, api_key) => {
    return new Promise(function (resolve, reject) {
        server
            .get(endpoint, api_key)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const subscribers_with_alarm_state = function (state) {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    const current_endpoint = `${url}/cloudwatch/alarms/${state}/subscribers`;
    return server_get(current_endpoint, api_key);
};

const all_alarms_for_region = _.memoize(function (region) {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    region = encodeURIComponent(region);
    const current_endpoint = `${url}/cloudwatch/alarms/all/${region}`;
    return server_get(current_endpoint, api_key);
});

const alarms_for_subscriber = _.memoize(function (arn) {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    arn = encodeURIComponent(arn);
    const current_endpoint = `${url}/cloudwatch/alarms/subscriber/${arn}`;
    return server_get(current_endpoint, api_key);
});

const server_post = (endpoint, api_key, resource_arns) => {
    return new Promise(function (resolve, reject) {
        server
            .post(endpoint, api_key, resource_arns)
            .then(function (response) {
                for (const arn of resource_arns) {
                    clear_alarms_for_subscriber_cache(arn);
                }
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const subscribe_to_alarm = function (region, alarm_name, resource_arns) {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    alarm_name = encodeURIComponent(alarm_name);
    const current_endpoint = `${url}/cloudwatch/alarm/${alarm_name}/region/${region}/subscribe`;
    return server_post(current_endpoint, api_key, resource_arns);
};

const unsubscribe_from_alarm = function (region, alarm_name, resource_arns) {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    alarm_name = encodeURIComponent(alarm_name);
    const current_endpoint = `${url}/cloudwatch/alarm/${alarm_name}/region/${region}/unsubscribe`;
    return server_post(current_endpoint, api_key, resource_arns);
};

const delete_all_subscribers = function () {
    const current_connection = connections.get_current();
    const url = current_connection[0];
    const api_key = current_connection[1];
    const current_endpoint = `${url}/cloudwatch/alarms/subscribed`;
    return new Promise((resolve, reject) => {
        server
            .delete_method(current_endpoint, api_key)
            .then((response) => {
                alarms_for_subscriber.cache.clear();
                resolve(response);
            })
            .catch(function (error) {
                console.error(error);
                reject(error);
            });
    });
};

const clear_alarms_for_subscriber_cache = function (subscribers) {
    if (Array.isArray(subscribers)) {
        for (const subscriber of subscribers) {
            alarms_for_subscriber.cache.delete(subscriber.ResourceArn);
        }
    } else if (typeof subscribers == "string") {
        alarms_for_subscriber.cache.delete(subscribers);
    } else {
        alarms_for_subscriber.cache.clear();
    }
};

const cache_update = function () {
    subscribers_with_alarm_state("ALARM")
        .then(function (response) {
            previous_subscribers_with_alarms = current_subscribers_with_alarms;
            current_subscribers_with_alarms = _.sortBy(response, "ResourceArn");
            const added = _.differenceBy(
                current_subscribers_with_alarms,
                previous_subscribers_with_alarms,
                "ResourceArn"
            );
            const removed = _.differenceBy(
                previous_subscribers_with_alarms,
                current_subscribers_with_alarms,
                "ResourceArn"
            );
            if (added.length || removed.length) {
                clear_alarms_for_subscriber_cache(added);
                clear_alarms_for_subscriber_cache(removed);
                for (const f of listeners) {
                    f(
                        current_subscribers_with_alarms,
                        previous_subscribers_with_alarms
                    );
                }
            }
            // }
        })
        .catch(function (error) {
            console.error(error);
        });
};

const load_update_interval = function () {
    return new Promise(function (resolve) {
        settings.get(settings_key).then(function (value) {
            const seconds = Number.parseInt(value);
            update_interval = seconds * 1000;
            resolve();
        });
    });
};

const set_update_interval_setting = function (seconds) {
    // create a default
    update_interval = seconds * 1000;
    return settings.put(settings_key, seconds);
};

const schedule_interval = function () {
    if (intervalID) {
        clearInterval(intervalID);
    }
    intervalID = setInterval(cache_update, update_interval);
    console.log("alarms: interval scheduled " + update_interval + "ms");
};

export const deferred_init = function () {
    load_update_interval().then(function(){
        schedule_interval();
    });
    setInterval(function () {
        try {
            all_alarms_for_region.cache.clear();
        } catch (error) {
            console.log(error);
        }
    }, region_cache_clear_interval_ms);
};

export function get_subscribers_with_alarms() {
    return {
        current: current_subscribers_with_alarms,
        previous: previous_subscribers_with_alarms,
    };
}

export function add_callback(f) {
    if (!listeners.includes(f)) {
        listeners.push(f);
    }
    if (!intervalID && update_interval) {
        schedule_interval();
    }
}

export {
    all_alarms_for_region,
    subscribe_to_alarm,
    unsubscribe_from_alarm,
    alarms_for_subscriber,
    delete_all_subscribers,
};

export function set_update_interval(seconds) {
    set_update_interval_setting(seconds).then(function () {
        schedule_interval();
    });
}

export function get_update_interval() {
    return update_interval;
}

export const exported_for_unit_tests = {
    listeners,
    update_interval,
    set_update_interval_setting,
    schedule_interval
};
