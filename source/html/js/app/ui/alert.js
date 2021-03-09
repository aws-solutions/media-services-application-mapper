/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery"], function($) {

    var timeout = 5000;

    var div_id = "alert_div";

    var show = function(message) {
        $("#" + div_id).html(message);
        $("#" + div_id).fadeIn('slow');
        setTimeout(function() {
            $("#" + div_id).fadeOut('slow');
        }, timeout);
    };

    return {
        "show": show
    };

});