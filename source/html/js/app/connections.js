/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// Cookie: MSAM_CURRENT = "Cookie Name" or missing (not saved)
// Cookie: MSAM_ENDPOINT_<ID> = "{ URL, Key, Last }"

const cookie_name_current = "MSAM_CURRENT",
    cookie_name_prefix = "MSAM_ENDPOINT_",
    session_current = "MSAM_CURRENT",
    max_age = 7;

// return the stored connection objects
const get_remembered = _.memoize(function () {
    let history = [],
        cookies = Cookies.get();
    for (let name of Object.keys(cookies)) {
        if (name.startsWith(cookie_name_prefix)) {
            let payload = cookies[name],
                content = JSON.parse(window.atob(payload));
            history.push(content);
        }
    }
    return history;
});

// return the session copy or the cookie copy, or null
const get_current = _.memoize(function () {
    let current = null;
    let encoded = window.sessionStorage.getItem(session_current);
    if (encoded) {
        current = JSON.parse(window.atob(encoded));
    }
    // get the cookie and refresh the expiration
    let payload = Cookies.get(cookie_name_current);
    if (payload) {
        // set the cookie again for expiration
        Cookies.set(cookie_name_current, payload, {
            expires: max_age,
        });
        let name = payload;
        payload = Cookies.get(name);
        // something?
        if (payload) {
            // set the cookie again for expiration
            Cookies.set(name, payload, {
                expires: max_age,
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
const set_current = function (url, api_key, store = true) {
    clear_function_cache();
    let current = [url, api_key];
    window.sessionStorage.setItem(
        session_current,
        window.btoa(JSON.stringify(current))
    );
    let cookie_name = cookie_name_prefix + objectHash.sha1(url);
    let encoded = window.btoa(JSON.stringify(current));
    if (store) {
        // add or update MSAM_ENDPOINT_<ID> cookie
        Cookies.set(cookie_name, encoded, {
            expires: max_age,
        });
        // rewrite MSAM_CURRENT cookie
        Cookies.set(cookie_name_current, cookie_name, {
            expires: max_age,
        });
    } else {
        Cookies.remove(cookie_name_current);
        Cookies.remove(cookie_name);
    }
};

const clear_function_cache = function () {
    get_current.cache.clear();
    get_remembered.cache.clear();
};

// is there a connection override on the URL parameters?
let current_url = new URL(window.location);
let endpoint = current_url.searchParams.get("endpoint");
let key = current_url.searchParams.get("key");

if (endpoint && key) {
    // strip any trailing slashes
    if (endpoint.endsWith("/")) {
        endpoint = endpoint.substring(0, endpoint.length - 1);
    }
    console.log("Connection override with URL parameters");
    set_current(endpoint, key, false);
}

export { get_remembered, set_current, get_current };
