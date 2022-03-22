/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as alarms from "../alarms.js";
import * as regions from "../regions.js";
import * as alert from "./alert.js";
import * as diagrams from "./diagrams.js";
import * as tile_view from "./tile_view.js";
import * as channels from "../channels.js";

let selected_alarm_data;
let selected_alarm_region;

let progress_value = 0;
let progress_start_time = 0;
let progress_timer_id = 0;

const set_progress_message = function (message) {
    $("#subscribe_to_alarms_progress").html(message);
};

const alarms_tabulator = new Tabulator(
    "#subscribe_to_alarms_modal_alarm_selection",
    {
        placeholder: "No Alarms to Show",
        tooltips: true,
        height: 400, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        layout: "fitColumns", //fit columns to width of table (optional)
        selectable: true,
        selectableRangeMode: "click",
        columns: [
            //Define Table Columns
            {
                title: "Alarm",
                field: "AlarmName",
                headerFilter: true,
            },
            {
                title: "Namespace",
                field: "Namespace",
                headerFilter: true,
            },
            {
                title: "Metric",
                field: "MetricName",
                headerFilter: true,
            },
            {
                title: "State",
                field: "StateValue",
                headerFilter: true,
            },
        ],
        rowSelectionChanged: function (data) {
            //update selected row counter on selection change
            selected_alarm_data = data;
            $("#subscribe_to_alarms_modal_alarm_selection_count").text(
                data.length
            );
            const diagram = diagrams.shown();
            if (diagram) {
                subscribe_save_button(
                    diagram.network.getSelectedNodes().length > 0 &&
                        data.length > 0
                );
            }
        },
    }
);

const nodes_tabulator = new Tabulator(
    "#subscribe_to_alarms_modal_selected_items",
    {
        placeholder: "No Model Items Selected",
        tooltips: true,
        selectable: false,
        height: 200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        layout: "fitColumns", //fit columns to width of table (optional)
        columns: [
            //Define Table Columns
            {
                title: "Type",
                field: "title",
            },
            {
                title: "Name",
                field: "name",
            },
            {
                title: "ARN",
                field: "id",
            },
        ],
    }
);

const progress_bar_html = function (value, text, color_class) {
    return `<div class="m-2"><div class="progress"><div class="progress-bar ${color_class}" role="progressbar" style="width: ${value}%" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100">${text}</div></div></div>`;
};

const start_progress_message = function () {
    end_progress_message();
    progress_value = 0;
    progress_start_time = new Date().getTime();
    progress_timer_id = setInterval(function () {
        update_progress_message();
    }, 500);
    update_progress_message();
};

const update_progress_message = function () {
    const delta_ms = new Date().getTime() - progress_start_time;
    const progress_duration_seconds = Math.round(delta_ms / 1000);
    const html = progress_bar_html(
        progress_value,
        `Loading alarms (${progress_duration_seconds}s)`,
        "bg-warning"
    );
    set_progress_message(html);
    progress_value += 5;
    if (progress_value > 100) {
        progress_value = 0;
    }
};

const end_progress_message = function () {
    if (progress_timer_id) {
        clearInterval(progress_timer_id);
    }
};

const populate_alarms_from_region = function (region) {
    selected_alarm_region = region;
    start_progress_message();
    $("#subscribe_to_alarms_modal_alarm_selection_count").text("0");
    alarms_tabulator.clearData();
    alarms
        .all_alarms_for_region(region)
        .then(function (response) {
            end_progress_message();
            const html = progress_bar_html(
                100,
                `${response.length} alarm${
                    response.length != 1 ? "s" : ""
                } in this region`,
                "bg-success"
            );
            set_progress_message(html);
            if (response.length > 0) {
                alarms_tabulator.setData(response);
            }
        })
        .catch(function (error) {
            end_progress_message();
            const html = progress_bar_html(100, `${error}`, "bg-danger");
            set_progress_message(html);
        });
};

const populate_selected_items = function (node_ids) {
    const data = _.compact(model.nodes.get(node_ids));
    // placed a scrubbed list of node ids on the dialog as a data attribute
    $("#subscribe_to_alarms_modal").attr(
        "data-node-ids",
        JSON.stringify(_.map(data, "id"))
    );
    // $("#subscribe_to_alarms_modal_selected_items").tabulator("setData", data);
    nodes_tabulator.setData(data);
};

const subscribe_save_button = function (enable) {
    if (enable) {
        // enable the save button
        $("#subscribe_to_alarms_save").removeClass("disabled");
        $("#subscribe_to_alarms_save").attr("aria-disabled", false);
        $("#subscribe_to_alarms_save").attr("disabled", false);
    } else {
        // disable the save button
        $("#subscribe_to_alarms_save").addClass("disabled");
        $("#subscribe_to_alarms_save").attr("aria-disabled", true);
        $("#subscribe_to_alarms_save").attr("disabled", true);
    }
};

$("#alarms_subscribe_button").on("click", function () {
    show_alarm_subscribe_dialog();
});

function show_alarm_subscribe_dialog() {
    populate_alarms_from_region(selected_region());
    const diagram = diagrams.shown();
    if (diagram) {
        if (diagram.network.getSelectedNodes().length > 0) {
            subscribe_save_button(false);
            populate_selected_items(diagram.network.getSelectedNodes());
            $("#subscribe_to_alarms_modal").modal("show");
        } else {
            alert.show("Select at least one node");
        }
    } else if (tile_view.shown()) {
        const tile_name = tile_view.selected();
        if (tile_name) {
            channels.retrieve_channel(tile_name).then(function (members) {
                const node_ids = _.map(members, "id");
                populate_selected_items(node_ids);
                $("#subscribe_to_alarms_modal").modal("show");
            });
        } else {
            alert.show("Select a tile");
        }
    }
}

$("#subscribe_to_alarms_save").on("click", function () {
    // const diagram = diagrams.shown();
    const node_ids = JSON.parse(
        $("#subscribe_to_alarms_modal").attr("data-node-ids")
    );
    const promises = [];
    for (let alarm of selected_alarm_data) {
        promises.push(
            alarms.subscribe_to_alarm(
                selected_alarm_region,
                alarm.AlarmName,
                node_ids
            )
        );
    }
    Promise.all(promises)
        .then(async function () {
            alert.show("Saved");
            $("#subscribe_to_alarms_modal").modal("hide");
            console.log("refresh monitor views");
            const monitor_view = await import("./monitor_view.js");
            monitor_view.refresh();
        })
        .catch(function () {
            alert.show("Error while saving");
        });
});

$("#subscribe_to_alarms_cancel").on("click", function () {
    console.log("subscribe_to_alarms_cancel");
    $("#subscribe_to_alarms_modal").modal("hide");
});

// configure alarm subscription dialog
regions.refresh().then(function (module) {
    $("#subscribe_to_alarms_region_dropdown").empty();
    for (let region of module.get_available()) {
        const id = `alarm_subscribe_region_${region.RegionName}`;
        const button_html = `<a class="dropdown-item" href="#" id="${id}">${region.RegionName}</button><br>`;
        $("#subscribe_to_alarms_region_dropdown").append(button_html);
        $("#" + id).on(
            "click",
            (function (local_region, local_jq) {
                const local_name = local_region.RegionName;
                return function () {
                    local_jq("#dropdownMenuButton").text(local_name);
                    populate_alarms_from_region(local_name);
                };
            })(region, $)
        );
    }
    const first_region = "us-east-1";
    $("#dropdownMenuButton").text(first_region);
});

const selected_region = function () {
    return $("#dropdownMenuButton").text();
};

export { show_alarm_subscribe_dialog };
