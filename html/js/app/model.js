/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "vis", "app/plugins", "app/server", "app/connections"], function($, vis, plugins, server, connections) {
    var nodes = new vis.DataSet();
    var edges = new vis.DataSet();

    var reset = function() {
        nodes.clear();
        edges.clear();
    };

    var map = function(callback) {
        new Promise(function(resolve, reject) {
            var promises = [];
            require(plugins.nodes, function() {
                for (let mapper of arguments) {
                    console.log(mapper.name);
                    promises.push(mapper.update());
                }
                Promise.all(promises).then(function() {
                    resolve();
                });
            });
        }).then(function() {
            var promises = [];
            require(plugins.connections, function() {
                for (let mapper of arguments) {
                    console.log(mapper.name);
                    promises.push(mapper.update());
                }
                Promise.all(promises).then(function() {
                    if (typeof callback !== 'undefined') {
                        callback();
                    }
                });
            });
        }).catch(function(error) {
            console.log(error);
        });
    };

    // update the JSON data portion of the node or connection
    var update = function(arn) {
        var current = connections.get_current();
        var url = current[0];
        var api_key = current[1];
        return new Promise(function(resolve, reject) {
            server.get(url + "/cached/arn/" + arn, api_key).then(function(cached) {
                // we should get 0 or 1 results only
                if (cached && cached.length == 1) {
                    var cache_entry = cached[0];
                    var data = JSON.parse(cache_entry.data);
                    // node or connection?
                    var node;
                    if (data.to && data.from) {
                        node = edges.get(arn);
                    } else {
                        node = nodes.get(arn);
                    }
                    if (!node) {
                        reject("arn " + arn + " not found");
                    } else {
                        node.data = data;
                        resolve(node);
                    }
                } else {
                    reject("arn " + arn + " not found");
                }
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var put_records = function(record) {
        var current = connections.get_current();
        var url = current[0];
        var api_key = current[1];
        var current_endpoint = `${url}/cached`;
        if (record && !Array.isArray(record)) {
            record = [record];
        }
        return new Promise(function(resolve, reject) {
            server.post(current_endpoint, api_key, record).then(function(response) {
                console.log(response);
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var delete_record = function(arn) {
        var current = connections.get_current();
        var url = current[0];
        var api_key = current[1];
        var current_endpoint = `${url}/cached/arn/${encodeURIComponent(arn)}`;
        return new Promise(function(resolve, reject) {
            server.delete_method(current_endpoint, api_key).then(function(response) {
                console.log(response);
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    // clear the model at module definition
    reset();

    return {
        "nodes": nodes,
        "edges": edges,
        "reset": reset,
        "map": map,
        "update": update,
        "put_records": put_records,
        "delete_record": delete_record
    }
});