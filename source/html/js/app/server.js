/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// default 60 second timeout
let request_timeout = 60 * 1000;

const get = function (url, api_key) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Accept': 'application/json',
            'x-api-key': api_key
        };
        // get the library contents
        $.ajax({
            url: url,
            type: "GET",
            headers: headers,
            success: (data) => {
                resolve(data);
            },
            error: (data) => {
                reject(data);
            },
            timeout: request_timeout
        });
    });
};

const post = function (url, api_key, data) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Accept': 'application/json',
            'x-api-key': api_key
        };
        // get the library contents
        $.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify(data),
            headers: headers,
            contentType: "application/json",
            success: (data) => {
                resolve(data);
            },
            error: (data) => {
                console.log(data);
                reject(data);
            },
            timeout: request_timeout
        });
    });
};

const delete_method = function (url, api_key) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Accept': 'application/json',
            'x-api-key': api_key
        };
        // get the library contents
        $.ajax({
            url: url,
            type: "DELETE",
            headers: headers,
            contentType: "application/json",
            success: (data) => {
                resolve(data);
            },
            error: (data) => {
                console.log(data);
                reject(data);
            },
            timeout: request_timeout
        });
    });
};

const delete_method_with_body = function (url, api_key, data) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Accept': 'application/json',
            'x-api-key': api_key
        };
        // get the library contents
        $.ajax({
            url: url,
            type: "DELETE",
            data: JSON.stringify(data),
            headers: headers,
            contentType: "application/json",
            success: (data) => {
                resolve(data);
            },
            error: (data) => {
                console.log(data);
                reject(data);
            },
            timeout: request_timeout
        });
    });
};

export { get, post, delete_method, delete_method_with_body };

export function get_request_timeout() {
    return request_timeout;
}

export function set_request_timeout(timeout) {
    request_timeout = timeout;
}
