/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery"], function($) {
    /** default 60 second timeout */
    let request_timeout = 60 * 1000;
    const contentType = 'application/json';
    const getHeaders = apiKey => ({ 'Accept': contentType, 'X-Api-Key': apiKey });

    const get = (url, api_key) => new Promise((resolve, reject) => {
        $.ajax({
            async: true,
            crossDomain: true,
            url: url,
            type: "GET",
            headers: getHeaders(api_key),
            success: resolve,
            error: reject
        });
    });

    const post = (url, api_key, data) => new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify(data),
            timeout: request_timeout,
            headers: getHeaders(api_key),
            contentType: "application/json",
            success: resolve,
            error: (data) => {
                console.log(data);
                reject(data);
            }
        });
    });

    const delete_method = (url, api_key) => new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "DELETE",
            timeout: request_timeout,
            headers: getHeaders(api_key),
            contentType: "application/json",
            success: resolve,
            error: (data) => {
                console.log(data);
                reject(data);
            }
        });
    });

    const delete_method_with_body = (url, api_key, data) => new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "DELETE",
            data: JSON.stringify(data),
            timeout: request_timeout,
            headers: getHeaders(api_key),
            contentType: contentType,
            success: resolve,
            error: (data) => {
                console.log(data);
                reject(data);
            }
        });
    });

    return {
        get: get,
        post: post,
        delete_method: delete_method,
        delete_method_with_body: delete_method_with_body,
        get_request_timeout: function() {
            return request_timeout;
        },
        set_request_timeout: function(timeout) {
            request_timeout = timeout;
        }
    };
});