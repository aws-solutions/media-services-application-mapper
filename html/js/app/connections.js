/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "cookie", "app/window"], function($, cookie, window) {
    var cookie_name = "connections";
    // keep last 10 connections
    var max_history = 10;
    // keep for 90 days
    var max_age = 90;
    var connection_history;
    // check if the cookie has a persisted value
    var encoded = cookie.get(cookie_name);
    if (encoded != undefined) {
        // yes
        connection_history = new Map(JSON.parse(window.atob(encoded)));
    } else {
        // no, start with empty
        connection_history = new Map();
    }
    // return the recent connection objects
    var get_history = function() {
        return connection_history.values();
    };
    // update the history with another connection
    var set_current = function(url, api_key) {
        latest = [url, api_key];
        // seek through the map looking for the same endpoint
        connection_history.forEach(function(value, key, map) {
            if (value[0] == latest[0] && value[1] == latest[1]) {
                // delete it
                map.delete(key);
            }
        });
        // add the new one with current time
        connection_history.set(new Date().getTime(), latest);
        // sort based on time
        connection_history = new Map([...connection_history.entries()].sort(function(a, b) {
            if (a < b) {
                return 1;
            }
            if (a > b) {
                return -1;
            }
            // equal
            return 0;
        }));
        var size = 0;
        connection_history.forEach(function(value, key, map) {
            size++;
            if (size > max_history) {
                map.delete(key);
            }
        });
        var encoded_history = window.btoa(JSON.stringify([...connection_history]));
        cookie.set(cookie_name, encoded_history, {
            expires: max_age
        });
    };
    var get_current = function() {
        var r;
        if (connection_history.size > 0) {
            r = connection_history.values().next().value;
        } else {
            r = null;
        }
        return r;
    };
    var clear_history = function() {
        var current = get_current();
        connection_history.clear();
        set_current(current[0], current[1]);
    };
    // is there a connection override on the URL parameters?
    var current_url = new URL(window.location);
    var endpoint = current_url.searchParams.get("endpoint");
    var key = current_url.searchParams.get("key");
    if (endpoint && key) {
        console.log("Connection override with URL paramteres");
        set_current(endpoint, key);
    };
    return {
        "get_history": get_history,
        "set_current": set_current,
        "get_current": get_current,
        "clear_history": clear_history
    };
});