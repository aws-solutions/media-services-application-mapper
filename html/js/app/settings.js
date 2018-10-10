/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["app/server", "app/connections"], function(server, connections) {

    var get_setting = function(id) {
        // get the current connection data
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        // create the resource url
        var current_endpoint = `${url}/settings/${id}`;
        // return a promise that response with result
        return new Promise((resolve, reject) => {
            server.get(current_endpoint, api_key).then((response) => {
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var put_setting = function(id, value) {
        // get the current connection data
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        // create the resource url
        var current_endpoint = `${url}/settings/${id}`;
        return new Promise((resolve, reject) => {
            var data = value;
            server.post(current_endpoint, api_key, data).then((response) => {
                resolve();
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var remove_setting = function(id) {
        // get the current connection data
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        // create the resource url
        var current_endpoint = `${url}/settings/${id}`;
        return new Promise((resolve, reject) => {
            server.delete_method(current_endpoint, api_key).then((response) => {
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    return {
        "get": get_setting,
        "put": put_setting,
        "remove": remove_setting
    };
});