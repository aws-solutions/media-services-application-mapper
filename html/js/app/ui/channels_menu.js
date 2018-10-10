/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "app/ui/global_view", "app/ui/util", "app/channels", "app/ui/alert"], function($, model, global_view, ui_util, channels, alert) {

    $("#channel_definition_name").on("input propertychange", () => {
        var text = $("#channel_definition_name").val().trim();
        if (text.length > 0) {
            $("#save_channel_definition").removeClass("disabled");
            $("#save_channel_definition").attr("aria-disabled", false);
        } else {
            $("#save_channel_definition").addClass("disabled");
            $("#save_channel_definition").attr("aria-disabled", true);
        }
    });

    // save button on create channel dialog
    $("#save_channel_definition").on("click", function(event) {
        var channel_name = $("#channel_definition_name").val().trim();
        console.log("save new channel = " + channel_name);
        var node_ids = global_view.get_selected().nodes;
        channels.create_channel(channel_name, node_ids).then(function(response) {
            console.log(response);
            alert.show("Channel created");
            var tile_view = require("app/ui/tile_view");
            tile_view.redraw_tiles();
        }).catch(function(error) {
            console.log(error);
        });
    });

    $("#channels_dropdown").on("click", function(event) {
        var needs_selected_nodes = ["channels_create_channel_button", "channels_add_to_channel_button"];
        if (global_view.get_selected().nodes.length == 0) {
            needs_selected_nodes.forEach(function(value, index, array) {
                $("#" + value).addClass("disabled");
                $("#" + value).attr("aria-disabled", true);
            });
        } else {
            needs_selected_nodes.forEach(function(value, index, array) {
                $("#" + value).removeClass("disabled");
                $("#" + value).attr("aria-disabled", false);
            });
        }
    });

    // $("#channels_create_channel_button").on("click", function(event) {
    // var nodes = global_view.get_selected().nodes;
    // console.log("create channel " + JSON.stringify(nodes));
    // });

    $("#channel_definition_modal").on("show.bs.modal", function(event) {
        $("#channel_definition_name").val("");
        // populate the dialog with the selected items when it is shown
        console.log("channel modal show");
        // initially disable save button
        $("#save_channel_definition").addClass("disabled");
        $("#save_channel_definition").attr("aria-disabled", true);
        // empty the body compartment
        $("#channel_definition_modal_items").empty();
        var channel_content = "";
        $.each(global_view.get_selected().nodes, function(index, id) {
            var node = model.nodes.get(id);
            channel_content += `<tr><th scope="row">${index+1}</th><td>${node.title}</td><td>${node.id}</td></tr>`;
        });
        var html = `
        <table class="table table-sm table-hover">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Type</th>
                    <th scope="col">ARN</th>
                </tr>
            </thead>
            <tbody>
                ${channel_content}
            </tbody>
        </table>`;
        $("#channel_definition_modal_items").html(html);
    });

    $("#channel_definition_modal").on("hide.bs.modal", function(event) {
        console.log("channel modal hide");
    });

    $("#channel_add_node_modal").on("show.bs.modal", function(event) {
        var channel_content = "";
        $.each(global_view.get_selected().nodes, function(index, id) {
            var node = model.nodes.get(id);
            channel_content += `<tr><th scope="row">${index+1}</th><td>${node.title}</td><td data-node-id="${node.id}">${node.id}</td></tr>`;
        });
        var html = `
        <table class="my-3 table table-sm table-hover">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Type</th>
                    <th scope="col">ARN</th>
                </tr>
            </thead>
            <tbody>
                ${channel_content}
            </tbody>
        </table>`;
        $("#channel_add_node_modal_items").html(html);
        channels.channel_list().then(function(channel_list) {
            var channel_content = "";
            $.each(channel_list.sort(), function(index, member) {
                // var data = JSON.stringify(node.data);
                var checkbox_id = ui_util.makeid();
                channel_content += `
                    <tr><th scope="row">${index+1}</th>
                    <td>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="${checkbox_id}" value="${member}">
                    </div>
                    </td>
                    <td>${member}</td></tr>
                `;
            });
            var html = `
                <table id="channel_add_node_modal_items_table" class="my-3 table table-sm table-hover">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Add to Channel</th>
                            <th scope="col">Channel Tile Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${channel_content}
                    </tbody>
                </table>`;
            $("#channel_add_node_modal_channels").html(html);
        });
    });

    $("#save_channel_add_node").on("click", function(event) {
        var members = $("#channel_add_node_modal_items td[data-node-id]");
        var node_ids = [];
        $.each(members, function(index, item) {
            node_ids.push(item.dataset.nodeId);
        });
        var channel_checks = $("#channel_add_node_modal_channels input[type='checkbox']");
        var promises = [];
        $.each(channel_checks, function(index, item) {
            if (item.checked === true) {
                promises.push(channels.update_channel(item.value, node_ids));
            }
        });
        Promise.all(promises).then(function() {
            var tile_view = require("app/ui/tile_view");
            tile_view.redraw_tiles();
        });
    });
});