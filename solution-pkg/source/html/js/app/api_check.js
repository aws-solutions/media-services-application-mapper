/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["app/server"], function(server) {

    var ping = function(url, api_key) {
        var current_endpoint = `${url}/ping`;
        return server.get(current_endpoint, api_key);
    };

    return {
        "ping": ping
    };

});