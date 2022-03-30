/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as build_numbers from "../tools/build_numbers.js";

const show_result = (success, message) => {
    const alert_class = success ? "alert-success" : "alert-danger";
    const prefix = success ? "" : "Failed: ";
    const html = `<div class="alert ${alert_class}" style="width: 100%; text-align: center;" role="alert">${prefix}MSAM Version</div>`;
    $("#tool_output_modal_title").html(html);
    $("#tool_output_modal_message").html(message);
    $("#tool_output_modal").modal("show");
};

$("#build-version-button").on("click", function () {
    build_numbers
        .run()
        .then(function (result) {
            show_result(result.success, result.message);
        })
        .catch(function (error) {
            show_result(false, error);
        });
});
