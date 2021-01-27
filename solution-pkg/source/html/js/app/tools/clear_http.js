/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery"], function($) {

    var name = "HTTP Connections (Clear)";

    var run_tool = function() {
        return Promise.resolve({
            name: name,
            success: true,
            message: "This is a placeholder. This tool will find and show cloud resource interconnections that use HTTP (clear) instead of HTTPS (encrypted)."
        });
    };

    return {
        "name": name,
        "run": run_tool,
        "requires_single_selection": false,
        "requires_multi_selection": false,
        "selection_id_regex": ".*"
    };
});