/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery"], function($) {

    var name = "Find Duplicate Named Services";

    var run_tool = function() {
        return Promise.resolve({
            name: name,
            success: false,
            message: "This is a placeholder. This tool will check names or IDs of services and warn on duplicates."
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