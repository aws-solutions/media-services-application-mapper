/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/plugins", "app/ui/util"], function($, _, plugins, ui_util) {

    var div_id = "tools-dropdown-menu";

    require(plugins.tools, function() {
        $.each(arguments, function(index, tool_module) {
            var menu_id = ui_util.makeid();
            var html = `<a class="dropdown-item" href="#" id="${menu_id}">${tool_module.name}</a>`;
            $("#" + div_id).append(html);
            $("#" + menu_id).on("click", (function() {
                var local_menu_id = menu_id;
                var local_module = tool_module;
                return function(event) {
                    local_module.run().then(function(result) {
                        var alert_class = result.success ? "alert-success" : "alert-danger";
                        var prefix = result.success ? "Passed" : "Failed";
                        var html = `<div class="alert ${alert_class}" style="width: 100%; text-align: center;" role="alert">${prefix}: Output for ${local_module.name}</div>`;
                        $("#tool_output_modal_title").html(html);
                        $("#tool_output_modal_message").html(result.message);
                        $("#tool_output_modal").modal('show');
                    }).catch(function(error) {
                        var alert_class = "alert-danger";
                        var html = `<div class="alert ${alert_class}" style="width: 100%; text-align: center;" role="alert">Failed: Output for ${local_module.name}</div>`;
                        $("#tool_output_modal_title").html(html);
                        $("#tool_output_modal_message").html(error);
                        $("#tool_output_modal").modal('show');
                    });
                };
            })());
        });
    });

});