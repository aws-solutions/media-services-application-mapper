/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as build_numbers from "../tools/build_numbers.js";

$("#build-version-button").on("click", function () {
    build_numbers
        .run()
        .then(function (result) {
            var alert_class = result.success ? "alert-success" : "alert-danger";
            var prefix = result.success ? "Passed" : "Failed";
            var html = `<div class="alert ${alert_class}" style="width: 100%; text-align: center;" role="alert">${prefix}: Output for build version</div>`;
            $("#tool_output_modal_title").html(html);
            $("#tool_output_modal_message").html(result.message);
            $("#tool_output_modal").modal("show");
        })
        .catch(function (error) {
            var alert_class = "alert-danger";
            var html = `<div class="alert ${alert_class}" style="width: 100%; text-align: center;" role="alert">Failed: Output for build version</div>`;
            $("#tool_output_modal_title").html(html);
            $("#tool_output_modal_message").html(error);
            $("#tool_output_modal").modal("show");
        });
});
