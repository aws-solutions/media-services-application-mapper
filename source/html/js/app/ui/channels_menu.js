/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as ui_util from "./util.js";
import * as channels from "../channels.js";
import * as alert from "./alert.js";
import * as diagrams from "./diagrams.js";

$("#tiles_add_new_tile_button").on("click", function () {
    const diagram = diagrams.shown();
    if (diagram && diagram.network.getSelectedNodes().length > 0) {
        $("#channel_definition_modal").modal("show");
    } else {
        // show the quick new tile
        show_quick_new_tile([]);
    }
});

$("#tiles_add_to_tile_button").on("click", function () {
    const diagram = diagrams.shown();
    if (diagram && diagram.network.getSelectedNodes().length > 0) {
        $("#channel_add_node_modal").modal("show");
    }
});

$("#channel_definition_name").on("input propertychange", () => {
    const text = $("#channel_definition_name").val().trim();
    if (text.length > 0) {
        $("#save_channel_definition").removeClass("disabled");
        $("#save_channel_definition").attr("aria-disabled", false);
    } else {
        $("#save_channel_definition").addClass("disabled");
        $("#save_channel_definition").attr("aria-disabled", true);
    }
});

// save button on create channel dialog
$("#save_channel_definition").on("click", function () {
    const channel_name = $("#channel_definition_name").val().trim();
    console.log("save new channel = " + channel_name);
    const diagram = diagrams.shown();
    const node_ids = diagram.network.getSelectedNodes();
    channels
        .create_channel(channel_name, node_ids)
        .then(async function (response) {
            console.log(response);
            alert.show("Tile created");
            const tile_view = await import("./tile_view.js");
            tile_view.redraw_tiles();
        })
        .catch(function (error) {
            console.error(error);
        });
});

$("#channel_definition_modal").on("show.bs.modal", function () {
    $("#channel_definition_name").val("");
    // populate the dialog with the selected items when it is shown
    console.log("channel modal show");
    // initially disable save button
    $("#save_channel_definition").addClass("disabled");
    $("#save_channel_definition").attr("aria-disabled", true);
    // empty the body compartment
    $("#channel_definition_modal_items").empty();
    let channel_content = "";
    const diagram = diagrams.shown();
    let index = 0;
    for (let id of diagram.network.getSelectedNodes()) {
        const node = model.nodes.get(id);
        channel_content += `<tr><th scope="row">${++index}</th><td>${
            node.title
        }</td><td>${node.id}</td></tr>`;
    }
    const html = `
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

$("#channel_definition_modal").on("hide.bs.modal", function () {
    console.log("channel modal hide");
});

$("#channel_add_node_modal").on("show.bs.modal", function () {
    let selected_content = "";
    const diagram = diagrams.shown();
    let selected_index = 0;
    for (let id of diagram.network.getSelectedNodes()) {
        const node = model.nodes.get(id);
        selected_content += `<tr><th scope="row">${++selected_index}</th><td>${
            node.title
        }</td><td draggable="true" data-node-id="${node.id}">${
            node.id
        }</td></tr>`;
    }
    const selected_html = `
        <table class="my-3 table table-sm table-hover">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Type</th>
                    <th scope="col">ARN</th>
                </tr>
            </thead>
            <tbody>
                ${selected_content}
            </tbody>
        </table>`;
    $("#channel_add_node_modal_items").html(selected_html);
    channels.channel_list().then(function (channel_list) {
        let channel_content = "";
        let channel_index = 0;
        for (let member of channel_list.sort()) {
            const checkbox_id = ui_util.makeid();
            channel_content += `
                    <tr><th scope="row">${++channel_index}</th>
                    <td>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="${checkbox_id}" value="${member}">
                    </div>
                    </td>
                    <td>${member}</td></tr>
                `;
        }
        const channel_html = `
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
        $("#channel_add_node_modal_channels").html(channel_html);
    });
});

$("#save_channel_add_node").on("click", function () {
    const members = $("#channel_add_node_modal_items td[data-node-id]");
    const node_ids = [];
    for (let item of members) {
        node_ids.push($(item).attr("data-node-id"));
    }
    const channel_checks = $(
        "#channel_add_node_modal_channels input[type='checkbox']"
    );
    const promises = [];
    for (let item of channel_checks) {
        if ($(item).prop("checked")) {
            promises.push(channels.update_channel($(item).val(), node_ids));
        }
    }
    Promise.all(promises).then(async function () {
        const tile_view = await import("./tile_view.js");
        tile_view.redraw_tiles();
    });
});

const set_quick_new_tile_alert = function (message) {
    const html = `<div id="quick_new_tile_dialog_alert" class="alert alert-danger" role="alert">${message}</div>`;
    $("#quick_new_tile_dialog_alert").replaceWith(html);
};

const clear_quick_new_tile_alert = function () {
    const html = `<div id="quick_new_tile_dialog_alert"></div>`;
    $("#quick_new_tile_dialog_alert").replaceWith(html);
};

$("#quick_new_tile_dialog").on("shown.bs.modal", function () {
    clear_quick_new_tile_alert();
    $("#quick_new_tile_dialog_name").val("");
    $("#quick_new_tile_dialog_name").focus();
});

$("#quick_new_tile_dialog_proceed").on("click", function () {
    try {
        // get the name
        const channel_name = $("#quick_new_tile_dialog_name").val();
        // check it
        const valid_name = /^\w+/;
        if (valid_name.test(channel_name)) {
            const node_ids = JSON.parse(
                $("#quick_new_tile_dialog").attr("node_ids")
            );
            channels
                .create_channel(channel_name, node_ids)
                .then(async function (response) {
                    console.log(response);
                    $("#quick_new_tile_dialog").modal("hide");
                    alert.show("Tile created");
                    const tile_view = await import("./tile_view.js");
                    tile_view.redraw_tiles();
                })
                .catch(function (error) {
                    console.error(error);
                });
        } else {
            set_quick_new_tile_alert(
                "Names must start with an alphanumeric character"
            );
        }
    } catch (error) {
        console.log(error);
        set_quick_new_tile_alert(
            "Names must start with an alphanumeric character"
        );
    }
});

function show_quick_new_tile(node_ids) {
    const encoded = JSON.stringify(node_ids);
    $("#quick_new_tile_dialog").attr("node_ids", encoded);
    $("#quick_new_tile_dialog").modal("show");
}

export { show_quick_new_tile };
