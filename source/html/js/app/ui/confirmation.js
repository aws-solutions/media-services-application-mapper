/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

export const show = function (html, on_proceed) {
    $("#confirmation_dialog_proceed").on("click", function (event) {
        console.log(event);
        on_proceed();
    });
    $("#confirmation_dialog").on("hide.bs.modal", function (event) {
        console.log(event);
        $("#confirmation_dialog_proceed").unbind("click");
    });
    $("#confirmation_dialog_body").html(html);
    $("#confirmation_dialog").modal("show");
};
