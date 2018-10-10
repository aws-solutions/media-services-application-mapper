/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery"], function($) {

    // default 60 second timeout
    var request_timeout = 60 * 1000;

    var get = function(url, api_key) {
        return new Promise((resolve, reject) => {
            var headers = {
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

    var post = function(url, api_key, data) {
        return new Promise((resolve, reject) => {
            var headers = {
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

    var deleteMethod = function(url, api_key) {
        return new Promise((resolve, reject) => {
            var headers = {
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

    return {
        "get": get,
        "post": post,
        "delete_method": deleteMethod,
        "get_request_timeout": function() {
            return request_timeout;
        },
        "set_request_timeout": function(timeout) {
            request_timeout = timeout;
        }
    };
});