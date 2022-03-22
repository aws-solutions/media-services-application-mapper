/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

const module_name = "HTTP Connections (Clear)";

const run_tool = function () {
    return Promise.resolve({
        name: module_name,
        success: true,
        message: "This is a placeholder. This tool will find and show cloud resource interconnections that use HTTP (clear) instead of HTTPS (encrypted)."
    });
};

export {
    module_name as name,
    run_tool as run
};

export const requires_single_selection = false;
export const requires_multi_selection = false;
export const selection_id_regex = ".*";
