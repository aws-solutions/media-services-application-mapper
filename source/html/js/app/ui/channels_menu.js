/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "app/ui/util", "app/channels", "app/ui/alert", "app/ui/diagrams"],
    function($, model, ui_util, channels, alert, diagrams) {

        $("#tiles_add_new_tile_button").on("click", function(event) {
            var diagram = diagrams.shown();
            if (diagram && diagram.network.getSelectedNodes().length > 0) {
                $("#channel_definition_modal").modal("show");
            } else {
                // show the quick new tile
                show_quick_new_tile([]);
            }
        });

        $("#tiles_add_to_tile_button").on("click", function(event) {
            var diagram = diagrams.shown();
            if (diagram && diagram.network.getSelectedNodes().length > 0) {
                $("#channel_add_node_modal").modal("show");
            }
        });

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
            var diagram = diagrams.shown();
            var node_ids = diagram.network.getSelectedNodes();
            channels.create_channel(channel_name, node_ids).then(function(response) {
                console.log(response);
                alert.show("Tile created");
                var tile_view = require("app/ui/tile_view");
                tile_view.redraw_tiles();
            }).catch(function(error) {
                console.log(error);
            });
        });

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
            var diagram = diagrams.shown();
            let index = 0;
            for (let id of diagram.network.getSelectedNodes()) {
                var node = model.nodes.get(id);
                channel_content += `<tr><th scope="row">${++index}</th><td>${node.title}</td><td>${node.id}</td></tr>`;
            }
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
            var diagram = diagrams.shown();
            let index = 0;
            for (let id of diagram.network.getSelectedNodes()) {
                var node = model.nodes.get(id);
                channel_content += `<tr><th scope="row">${++index}</th><td>${node.title}</td><td draggable="true" data-node-id="${node.id}">${node.id}</td></tr>`;
            }
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
                let index = 0;
                for (let member of channel_list.sort()) {
                    // var data = JSON.stringify(node.data);
                    var checkbox_id = ui_util.makeid();
                    channel_content += `
                    <tr><th scope="row">${++index}</th>
                    <td>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="${checkbox_id}" value="${member}">
                    </div>
                    </td>
                    <td>${member}</td></tr>
                `;
                }
                var html = `
                <table id="channel_add_node_modal_items_table" class="my-3 table table-sm table-hover">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Add to Channel</th>
                            <th scope="col">Tile Name</th>
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
            for (let item of members) {
                node_ids.push($(item).attr("data-node-id"));
            }
            var channel_checks = $("#channel_add_node_modal_channels input[type='checkbox']");
            var promises = [];
            for (let item of channel_checks) {
                if ($(item).prop("checked") == true) {
                    promises.push(channels.update_channel($(item).val(), node_ids));
                }
            }
            Promise.all(promises).then(function() {
                var tile_view = require("app/ui/tile_view");
                tile_view.redraw_tiles();
            });
        });

        var set_quick_new_tile_alert = function(message) {
            var html = `<div id="quick_new_tile_dialog_alert" class="alert alert-danger" role="alert">${message}</div>`;
            $("#quick_new_tile_dialog_alert").replaceWith(html);
        };

        var clear_quick_new_tile_alert = function() {
            var html = `<div id="quick_new_tile_dialog_alert"></div>`;
            $("#quick_new_tile_dialog_alert").replaceWith(html);
        };

        $("#quick_new_tile_dialog").on('shown.bs.modal', function() {
            clear_quick_new_tile_alert();
            $("#quick_new_tile_dialog_name").val("");
            $("#quick_new_tile_dialog_name").focus();
        });

        $("#quick_new_tile_dialog_proceed").on("click", function() {
            try {
                // get the name
                var channel_name = $("#quick_new_tile_dialog_name").val();
                // check it
                var valid_name = new RegExp("^\\w+");
                if (valid_name.test(channel_name)) {
                    var node_ids = JSON.parse($("#quick_new_tile_dialog").attr("node_ids"));
                    channels.create_channel(channel_name, node_ids).then(function(response) {
                        console.log(response);
                        $("#quick_new_tile_dialog").modal('hide');
                        alert.show("Tile created");
                        var tile_view = require("app/ui/tile_view");
                        tile_view.redraw_tiles();
                    }).catch(function(error) {
                        console.log(error);
                    });
                } else {
                    set_quick_new_tile_alert("Names must start with an alphanumeric character");
                }
            } catch (error) {
                console.log(error);
                set_quick_new_tile_alert("Names must start with an alphanumeric character");
            }
        });

        function show_quick_new_tile(node_ids) {
            var encoded = JSON.stringify(node_ids);
            $("#quick_new_tile_dialog").attr("node_ids", encoded);
            $("#quick_new_tile_dialog").modal('show');
        };

        return {
            show_quick_new_tile: show_quick_new_tile
        };

    });