/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["app/server", "app/connections", "app/settings"],
    function(server, connections, settings) {
        var selected = [];
        var available = [];

        var get_available = function() {
            return available;
        };

        var get_selected = function() {
            return selected;
        };

        var set_selected = function(regions) {
            return new Promise((resolve, reject) => {
                if (!Array.isArray(regions)) {
                    reject("regions must be an array");
                } else {
                    settings.put("regions", regions).then(function(response) {
                        selected = regions;
                        resolve();
                    });
                }
            });
        };

        var refresh = function() {
            var current_connection = connections.get_current();
            var url = current_connection[0];
            var api_key = current_connection[1];
            var all_endpoint = `${url}/regions`;
            return new Promise(function(resolve, reject) {
                server.get(all_endpoint, api_key).then(function(data) {
                    available = data;
                    available.sort(function(a, b) {
                        var nameA = a.RegionName;
                        var nameB = b.RegionName;
                        if (nameA < nameB) {
                            return -1;
                        } else
                        if (nameA > nameB) {
                            return 1;
                        } else {
                            // names must be equal
                            return 0;
                        }
                    });
                    settings.get("regions").then(function(data) {
                        if (data == null) {
                            data = [];
                        }
                        selected = data;
                        var module = {
                            "get_available": get_available,
                            "get_selected": get_selected,
                            "set_selected": set_selected
                        }
                        resolve(module);
                    });
                }).catch(function(error) {
                    console.log(error);
                    reject(error);
                });
            });
        };

        // regions returns an unexecuted promise; use refresh().then(function(module){})
        return refresh;
    });