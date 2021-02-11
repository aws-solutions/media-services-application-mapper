/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

'use strict';

define(["jquery", "cookie", "app/window", "object_hash", "lodash"], function($, cookie, window, hash, _) {
    // Cookie: MSAM_CURRENT = "Cookie Name" or missing (not saved)
    // Cookie: MSAM_ENDPOINT_<ID> = "{ URL, Key, Last }"

    var cookie_name_current = "MSAM_CURRENT",
        cookie_name_prefix = "MSAM_ENDPOINT_",
        session_current = "MSAM_CURRENT",
        max_age = 7;

    // return the stored connection objects
    var get_remembered = _.memoize(function() {
        var history = [],
            cookies = cookie.get();
        for (let name of Object.keys(cookies)) {
            if (name.startsWith(cookie_name_prefix)) {
                var payload = cookies[name],
                    content = JSON.parse(window.atob(payload));
                history.push(content);
            }
        }
        return history;
    });

    // return the session copy or the cookie copy, or null
    var get_current = _.memoize(function() {
        var current = null;
        var encoded = window.sessionStorage.getItem(session_current);
        if (encoded) {
            current = JSON.parse(window.atob(encoded));
        }
        // get the cookie and refresh the expiration
        var payload = cookie.get(cookie_name_current);
        if (payload) {
            // set the cookie again for expiration
            cookie.set(cookie_name_current, payload, {
                expires: max_age
            });
            var name = payload;
            payload = cookie.get(name);
            // something?
            if (payload) {
                // set the cookie again for expiration
                cookie.set(name, payload, {
                    expires: max_age
                });
                // set the session storage if not already
                if (!current) {
                    window.sessionStorage.setItem(session_current, payload);
                    current = JSON.parse(window.atob(payload));
                }
            }
        }
        return current;
    });

    // update the history with another connection
    var set_current = function(url, api_key, store = true) {
        clear_function_cache();
        var current = [url, api_key];
        window.sessionStorage.setItem(session_current, window.btoa(JSON.stringify(current)));
        var cookie_name = cookie_name_prefix + hash.sha1(url);
        var encoded = window.btoa(JSON.stringify(current));
        if (store) {
            // add or update MSAM_ENDPOINT_<ID> cookie
            cookie.set(cookie_name, encoded, {
                expires: max_age
            });
            // rewrite MSAM_CURRENT cookie
            cookie.set(cookie_name_current, cookie_name, {
                expires: max_age
            });
        } else {
            cookie.remove(cookie_name_current);
            cookie.remove(cookie_name);
        }
    };

    var clear_function_cache = function() {
        get_current.cache.clear();
        get_remembered.cache.clear();
    };

    // is there a connection override on the URL parameters?
    var current_url = new URL(window.location);
    var endpoint = current_url.searchParams.get("endpoint");
    var key = current_url.searchParams.get("key");

    if (endpoint && key) {
        // strip any trailing slashes
        if (endpoint.endsWith("/")) {
            var length = endpoint.length - 1;
            endpoint = endpoint.substr(0, length);
        }
        console.log("Connection override with URL parameters");
        set_current(endpoint, key, false);
    }

    return { get_remembered, set_current, get_current };
});