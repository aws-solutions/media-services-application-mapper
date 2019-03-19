/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["lodash", "app/server", "app/connections"], function(_, server, connections) {

    var last_channel_list;

    function have_any(node_ids) {
        // console.log(node_ids);
        var matches = [];
        // return a list of channel names that have any of these nodes
        return new Promise(function(outer_resolve, outer_reject) {
            var promises = [];
            channel_list().then(function(channel_names) {
                for (var name of channel_names) {
                    promises.push(
                        new Promise(function(resolve, reject) {
                            // console.log(name);
                            // look for model matches
                            retrieve_channel(name).then(function(contents) {
                                var channel_keys = Object.keys(contents).sort();
                                var intersect = _.intersection(node_ids, channel_keys);
                                // console.log(intersect);
                                if (intersect.length > 0) {
                                    matches.push(name);
                                }
                                resolve();
                            });
                        })
                    );
                }
            });
            Promise.all(promises).then(function() {
                // return it all
                outer_resolve(matches);
            });
        });
    }

    function have_all(node_ids) {
        // return a list of channel name that have all of these nodes
    }

    var create_channel = function(name, nodes) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/channel/${name}`;
        return new Promise(function(resolve, reject) {
            var data = nodes;
            server.post(current_endpoint, api_key, data).then(function(response) {
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var update_channel = create_channel;

    var delete_channel = function(name) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/channel/${name}`;
        return new Promise((resolve, reject) => {
            server.delete_method(current_endpoint, api_key).then((response) => {
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var retrieve_channel = function(name) {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/channel/${name}`;
        return new Promise(function(resolve, reject) {
            server.get(current_endpoint, api_key).then(function(response) {
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var channel_list = function() {
        var current_connection = connections.get_current();
        var url = current_connection[0];
        var api_key = current_connection[1];
        var current_endpoint = `${url}/channels`;
        return new Promise(function(resolve, reject) {
            server.get(current_endpoint, api_key).then(function(response) {
                last_channel_list = response;
                resolve(response);
            }).catch(function(error) {
                console.log(error);
                reject(error);
            });
        });
    };

    var arn_to_channels = function(arn) {
        return new Promise(function(outerResolve, outerReject) {
            channel_list().then(function(channels) {
                var matches = [];
                var promises = [];
                $.each(channels, function(channel_index, channel_name) {
                    promises.push(new Promise(function(resolve, reject) {
                        retrieve_channel(channel_name).then(function(members) {
                            $.each(members, function(member_index, member_value) {
                                if (member_value.id === arn) {
                                    matches.push(channel_name);
                                    return false;
                                }
                            });
                            resolve();
                        });
                    }));
                });
                Promise.all(promises).then(function() {
                    outerResolve(matches.sort());
                });
            }).catch(function(error) {
                console.log(error);
                outerReject(error);
            });
        });
    };

    var cached_channel_list = function() {
        if (!last_channel_list) {
            return channel_list();
        } else {
            return Promise.resolve(last_channel_list);
        }
    };

    return {
        "create_channel": create_channel,
        "update_channel": update_channel,
        "delete_channel": delete_channel,
        "retrieve_channel": retrieve_channel,
        "channel_list": channel_list,
        "arn_to_channels": arn_to_channels,
        "cached_channel_list": cached_channel_list,
        "have_any": have_any,
        "have_all": have_all
    };
});