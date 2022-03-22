/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */


const module_name = "Find Duplicate Named Services";

const run_tool = function () {
    return Promise.resolve({
        name: module_name,
        success: false,
        message: "This is a placeholder. This tool will check names or IDs of services and warn on duplicates."
    });
};

export {
    module_name as name,
    run_tool as run
};

export const requires_single_selection = false;
export const requires_multi_selection = false;
export const selection_id_regex = ".*";

