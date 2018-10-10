/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/server", "app/connections", "app/model", "app/ui/alert"], function($, server, connections, model, alert) {

    var purge_delay_millis = 5000;

    var purge_timer;

    var unsaved_nodes = [];

    var purge_nodes = function() {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/layout/nodes`;
        var save_list = unsaved_nodes.slice(0);
        // console.log("saving = " + JSON.stringify(save_list));
        unsaved_nodes = [];
        purge_timer = undefined;
        server.post(current_endpoint, api_key, save_list).then(function() {
            alert.show("Layout saved");
            console.log("layout changes are saved");
        }).catch(function(error) {
            console.log(error);
        });
    };

    var save_node = function(view, node, x, y) {
        if (typeof node == 'object') {
            id = node.id;
        } else {
            id = node;
        }
        unsaved_nodes.push({
            "view": view,
            "id": id,
            "x": x,
            "y": y
        });
        if (purge_timer === undefined) {
            purge_timer = setTimeout(purge_nodes, purge_delay_millis);
        }
        return Promise.resolve();
    };

    var restore_view = function(view) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/layout/view/${encodeURI(view)}`;
        return server.get(current_endpoint, api_key);
    };

    var remove_node_layout = function(id) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/layout/node/${encodeURI(id)}`;
        return server.deleteMethod(current_endpoint, api_key);
    };

    var save_layout = function(view_name) {
        alert.show("Saving layout");
        var global_view = require("app/ui/global_view");
        var network = global_view.get_network();
        $.each(model.nodes.get(), function(index, node) {
            var positions = network.getPositions([node.id]);
            save_node(view_name, node, positions[node.id].x, positions[node.id].y).then(function(response) {
                // console.log("ok");
            }).catch(function(error) {
                console.log(error);
            });
        });
    };

    return {
        "save_node": save_node,
        "save_layout": save_layout,
        "restore_view": restore_view
    };

});