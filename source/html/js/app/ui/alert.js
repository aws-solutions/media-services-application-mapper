/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

const timeout = 5000;

const div_id = "alert_div";

export const show = function (message) {
    $("#" + div_id).html(message);
    $("#" + div_id).fadeIn('slow');
    setTimeout(function () {
        $("#" + div_id).fadeOut('slow');
    }, timeout);
};

