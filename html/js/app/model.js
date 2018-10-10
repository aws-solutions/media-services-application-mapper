/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "vis", "app/plugins"], function($, vis, plugins) {
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
                $.each(arguments, function(index, mapper) {
                    console.log(mapper.name);
                    promises.push(mapper.update());
                });
                Promise.all(promises).then(function() {
                    resolve();
                });
            });
        }).then(function() {
            var promises = [];
            require(plugins.connections, function() {
                $.each(arguments, function(index, mapper) {
                    console.log(mapper.name);
                    promises.push(mapper.update());
                });
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

    // return the tip-node id and node ids of each cluster of 2 or more nodes
    var clusters = function() {
        var visited = [];
        var tips = [];
        // find all the nodes with only outgoing connections
        for (var node of nodes) {

        }
    }

    // clear the model at module definition
    reset();

    return {
        "nodes": nodes,
        "edges": edges,
        "reset": reset,
        "map": map
    }
});