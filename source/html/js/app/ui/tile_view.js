/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as channels from "../channels.js";
import * as model from "../model.js";
import * as ui_util from "./util.js";
import * as event_alerts from "../events.js";
import * as alarms from "../alarms.js";
import * as settings from "../settings.js";
import * as diagrams from "./diagrams.js";
import * as confirmation from "./confirmation.js";
import * as channels_menu from "./channels_menu.js";
import * as alert from "./alert.js"

const tile_row_div_id = "channel-tile-row-zkjewrvwdqywhwx";

let click_listeners = [];

const tile_outer_div = "channel-tiles-outer";

const content_div = "channel-tiles-diagram";

const tab_id = "channel-tiles-tab";

// interval in millis to check the cloud for tile changes
let update_interval;

let intervalID;

const settings_key = "app-tile-update-interval";

const tile_width_px = 240;
const tile_height_px = 175;

const tile_view_key = "tile-view";

const add_selection_callback = function (callback) {
    if (!click_listeners.includes(callback)) {
        click_listeners.push(callback);
    }
};

const event_alert_callback = function () {
    update_tile_info();
};

const alarm_callback = function () {
    update_tile_info();
};

const selection_listener = function (name) {
    toggle_tile(name);
};

const selected = function () {
    const tile = $(".selected-channel-tile");
    return filterXSS(tile.attr("data-channel-name"));
};

const toggle_tile = function (name) {
    if (name === selected()) {
        unselect_all();
    } else {
        select(name);
    }
};

const blink = function (blinks, tile) {
    const interval_ms = 500;
    if (blinks > 0) {
        setTimeout(function () {
            if (blinks % 2 === 0) {
                select(tile);
            } else {
                unselect(tile);
            }
            blink(blinks - 1, tile);
        }, interval_ms);
    } else {
        select(tile);
    }
};

const scroll_to_tile = function (name) {
    // scroll to the selected item
    const query = `[data-channel-name='${name}']`;
    const tile_element = $(query);
    $("#" + tile_row_div_id).animate(
        {
            scrollTop: tile_element.offset().top,
        },
        "slow"
    );
};

const select = function (name) {
    const unselected_tiles = $(".selected-channel-tile");
    unselected_tiles.removeClass("selected-channel-tile");
    const query = `[data-channel-name='${name}']`;
    const selected_tile = $(query);
    selected_tile.addClass("selected-channel-tile");
};

const unselect = function (name) {
    const query = `[data-channel-name='${name}']`;
    const selected_tile = $(query);
    selected_tile.removeClass("selected-channel-tile");
};

const unselect_all = function () {
    const query = `[data-channel-name]`;
    const unselected_tiles = $(query);
    unselected_tiles.removeClass("selected-channel-tile");
};

const shown = function () {
    return $("#" + tab_id).attr("aria-selected") === "true";
};

function tab_alert(state) {
    if (state) {
        $("#channel-tiles-tab-icon").text("warning");
    } else {
        $("#channel-tiles-tab-icon").text("grid_on");
    }
}

const show_edit_dialog = function (name, members) {
    $("#channel_edit_name").val(name);
    $("#channel_edit_name").attr("data-original-name", name);
    $("#channel_edit_modal_items").empty();
    let channel_content = "";
    let index = 0;
    for (let member of members) {
        const node = model.nodes.get(member.id);
        const checkbox_id = ui_util.makeid();
        if (node) {
            channel_content += `
                    <tr><th scope="row">${index + 1}</th>
                    <td>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="${checkbox_id}" value="${member.id}">
                    </div>
                    </td>
                    <td>${node.title}</td><td>${node.id}</td></tr>
                `;
        } else {
            channel_content += `
                    <tr><th scope="row">${index + 1}</th>
                    <td>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="${checkbox_id}" value="${member.id}">
                    </div>
                    </td>
                    <td><b>Missing Resource</b></td><td>${member.id}</td></tr>
                `;
        }
        index++;
    }
    const html = `
                        <table id="channel_edit_members_table" class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Remove</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">ARN</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${channel_content}
                            </tbody>
                        </table>`;
    $("#channel_edit_modal_items").html(html);
    $("#channel_edit_modal").modal("show");
};

const update_tile_info = async function () {    // NOSONAR
    const cached_events = event_alerts.get_cached_events();
    const cached_alarming_subscribers = alarms.get_subscribers_with_alarms();
    const channel_list = await channels.channel_list();
    for (let channel_name of channel_list) {
        const channel_members = await channels.retrieve_channel(channel_name);
        if (channel_members) {
            const query = `[data-channel-name='${channel_name}']`;
            const tile_id = $(query).attr("id");
            const resource_count_id = tile_id + "_resources";
            const missing_count_id = tile_id + "_missing";
            const event_count_id = tile_id + "_events";
            const alarm_count_id = tile_id + "_alarms";
            const resource_count = channel_members.length;
            let alert_count = 0;
            let alarm_count = 0;
            let missing_count = 0;
            let border_class = "border-success";
            for (let member of channel_members) {
                if(!model.nodes.get(member.id)){
                    missing_count ++;
                }
                const filtered_events = _.filter(cached_events.current, {
                    resource_arn: member.id,
                });
                alert_count += filtered_events.length;
                const filtered_alarms = _.filter(
                    cached_alarming_subscribers.current,
                    { ResourceArn: member.id }
                );
                alarm_count += filtered_alarms.length;
            }
            if (alert_count + alarm_count) {
                border_class = "border-danger";
                $("#" + tile_id).removeClass("border-success");
            } else {
                $("#" + tile_id).removeClass("border-danger");
            }
            if (channel_name == selected()) {
                border_class = `${border_class} selected-channel-tile`;
            }
            $("#" + tile_id).attr("data-alert-count", alert_count);
            $("#" + tile_id).attr("data-alarm-count", alarm_count);
            $("#" + tile_id).attr("data-resource-count", resource_count);
            $("#" + tile_id).attr("data-missing-count", missing_count);
            $("#" + tile_id).addClass(border_class);
            $("#" + resource_count_id).html(`${resource_count} cloud resource${resource_count === 1 ? "" : "s"}`);
            $(`#${missing_count_id}`).html(`<strong>${missing_count} missing resource${missing_count === 1 ? "" : "s"}</strong>`);
            $("#" + event_count_id).html(
                `${alert_count} alert event${alert_count === 1 ? "" : "s"}`
            );
            $("#" + alarm_count_id).html(
                `${alarm_count} alarm${alarm_count === 1 ? "" : "s"}`
            );

        }
    }
    sort_tiles();
    filter_tiles();
};

const sort_tiles = function () {
    const tiles = $("[data-channel-name]");
    tiles.sort(function (a, b) {
        let compare = 0;
        let compA =
            Number.parseInt($(a).attr("data-alert-count")) +
            Number.parseInt($(a).attr("data-alarm-count"));
        let compB =
            Number.parseInt($(b).attr("data-alert-count")) +
            Number.parseInt($(b).attr("data-alarm-count"));
        compare = compA < compB ? 1 : compA > compB ? -1 : 0;   // NOSONAR
        if (compare === 0) {
            compA = $(a).attr("data-channel-name");
            compB = $(b).attr("data-channel-name");
            compare = compA < compB ? -1 : compA > compB ? 1 : 0;   // NOSONAR
        }
        return compare;
    });
    for (let tile of tiles) {
        $("[data-tile-row]").append(tile);
    }
};

const filter_tiles = function () {
    let tiles = $("[data-channel-name]");
    load_tile_view().then(function (tile_settings) {
        update_filter_mode(tile_settings.tile_filter_text);
        const show_alarm_tiles = tile_settings.show_alarm_tiles;
        const show_normal_tiles = tile_settings.show_normal_tiles;
        for (let tile of tiles) {
            const total =
                Number.parseInt($(tile).attr("data-alert-count")) +
                Number.parseInt($(tile).attr("data-alarm-count"));
            const alarming = total > 0;
            if (show_alarm_tiles && show_normal_tiles) {
                $(tile).removeClass("d-none");
            } else if (show_alarm_tiles) {
                if (alarming) {
                    $(tile).removeClass("d-none");
                } else {
                    $(tile).addClass("d-none");
                }
            } else if (show_normal_tiles) {
                if (alarming) {
                    $(tile).addClass("d-none");
                } else {
                    $(tile).removeClass("d-none");
                }
            }
        }
        $("#" + tile_outer_div).removeClass("d-none");
        tab_alert($("#" + content_div + " .border-danger").length > 0);
    });
};

const redraw_tiles = async function () {    // NOSONAR
    $("#" + tile_outer_div).addClass("d-none");
    $("#" + content_div).html(
        `<div id="${tile_row_div_id}" data-tile-row="true" class="row ms-3">`
    );
    const channel_list = await channels.channel_list();
    const cached_events = event_alerts.get_cached_events();
    const cached_alarming_subscribers = alarms.get_subscribers_with_alarms();
    for (let channel_name of channel_list) {
        const local_channel_name = channel_name;
        let preferred_diagram = await settings.get(`${local_channel_name}-preferred-diagram`);
        let border_class = "border-success";
        const channel_members = await channels.retrieve_channel(
            local_channel_name
        );
        const resource_count = channel_members.length;
        let alert_count = 0;
        let alarm_count = 0;
        let missing_count = 0;
        for (let member of channel_members) {
            if(!model.nodes.get(member.id)){
                missing_count ++;
            }
            const filtered_events = _.filter(cached_events.current, {
                resource_arn: member.id,
            });
            alert_count += filtered_events.length;
            const filtered_alarms = _.filter(
                cached_alarming_subscribers.current,
                { ResourceArn: member.id }
            );
            alarm_count += filtered_alarms.length;
        }
        if (alert_count + alarm_count) {
            border_class = "border-danger";
        }
        if (local_channel_name == selected()) {
            border_class = `${border_class} selected-channel-tile`;
        }

        const channel_card_id = ui_util.makeid();
        const header_id = channel_card_id + "_header";
        const menu_id = channel_card_id + "_menu";
        const dropdown_id = channel_card_id + "_dropdown";
        const preferred_diagram_div = channel_card_id + "_preferred";
        const abbrev_tile_header = (local_channel_name.length > 40) ? 
                    `${local_channel_name.slice(0, 25)}...` : local_channel_name;
        const tile = `
                        <div draggable="true" class="card ${border_class} ms-4 mb-4 px-0" id="${channel_card_id}" data-alert-count="${alert_count}" data-alarm-count="${alarm_count}" data-channel-name="${channel_name}" data-tile-name="${channel_name}" data-resource-count="${channel_members.length}" data-missing-count="${missing_count}" style="border-width: 3px; width: ${tile_width_px}px; min-width: ${tile_width_px}px; max-width: ${tile_width_px}px; height: ${tile_height_px}px; min-height: ${tile_height_px}px; max-height: ${tile_height_px}px;">
                            <div class="card-header" style="cursor: pointer;" title="Click to Select, Doubleclick to Edit" id="${header_id}">${abbrev_tile_header}
                            </div>
                            <div class="card-body text-info my-0 py-1">
                                <h5 class="card-title my-0 py-0" id="${channel_card_id}_events">${alert_count} alert event${alert_count === 1 ? "" : "s"}</h5>
                                <h5 class="card-title my-0 py-0" id="${channel_card_id}_alarms">${alarm_count} alarm${alarm_count === 1 ? "" : "s"}</h5>
                                <p class="card-text small my-0 py-0" id="${channel_card_id}_resources" style="cursor: pointer;">${resource_count} cloud resource${resource_count === 1 ? "" : "s"}</p>
                                <p class="d-none card-text small my-0 py-0" id="${channel_card_id}_missing" style="cursor: pointer;"><strong>${missing_count} missing resource${missing_count === 1 ? "" : "s"}</strong></p>
                            </div>
                            <div class="btn-group btn-group-sm" aria-label="Tile Footer" style="height: 14%;">
                                <div style="position: absolute; top: 0; left: ${tile_width_px - 32}px; cursor: pointer;">
                                    <div class="dropdown">
                                        <button class="btn btn-sm p-0 m-0" type="button" id="${menu_id}" data-bs-toggle="dropdown" style="color: grey;">
                                            <span title="Matching diagrams" class="material-icons">image_aspect_ratio</span>
                                        </button>
                                        <div class="dropdown-menu m-0 p-0" aria-labelledby="${menu_id}" id="${dropdown_id}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
        $("#" + tile_row_div_id).append(tile);
        if (missing_count) {
            $(`#${channel_card_id}_missing`).removeClass("d-none");
        }
        // closure to capture state
        (function () {
            $(`#${channel_card_id}_resources,#${channel_card_id}_missing`).click(() => {
                $(`#${header_id}`).trigger("click");
            });
            const node_ids = _.map(channel_members, "id");
            $(`#${menu_id}`).click(() => {
                const matches = diagrams.have_any(node_ids, true);
                console.log(matches);
                $(`#${dropdown_id}`).empty();
                if (matches.length) {
                    $(`#${dropdown_id}`).append(`<h6 class="dropdown-header">Preferred diagram</h6>`);
                    $(`#${dropdown_id}`).append(`<div id="${preferred_diagram_div}"></div>`);
                    $(`#${dropdown_id}`).append(`<div class="dropdown-divider"></div>`);
                    $(`#${dropdown_id}`).append(`<h6 class="dropdown-header">Matching diagrams</h6>`);
                    for (let match of matches) {
                        const menu_item_id = ui_util.makeid();
                        const item = `<a id="${menu_item_id}" class="dropdown-item" tabindex="-1" href="#" style="cursor: pointer;" title="Click to Select, Right-click to set as preferred">${match.diagram} (${match.percent}%)</a>`;
                        if(preferred_diagram != null && preferred_diagram.diagram == match.diagram){
                            $(`#${preferred_diagram_div}`).append(item);
                        }
                        $(`#${dropdown_id}`).append(item);
                        (function () {
                            $(`#${menu_item_id}`).click(() => {
                                let hidden_diagrams = diagrams.get_hidden_diagrams();
                                var diagram = diagrams.get_by_name(match.diagram);
                                if (_.find(hidden_diagrams, {'hidden_diagram': diagram.name})){
                                    diagrams.add(diagram.name, diagram.view_id, false);
                                } 
                                diagram.network.once("afterDrawing", function () {
                                    diagram.network.fit({
                                        nodes: match.found,
                                        animation: true,
                                    });
                                    diagram.blink(10, match.found);
                                });
                                $("#view_tile_diagram_dialog").modal("hide");
                                diagram.show();
                            });
                        })();
                        (function () {
                            $(`#${menu_item_id}`).contextmenu(() => {
                                let html = `Make ${match.diagram} the preferred diagram for ${channel_name}?`;
                                confirmation.show(html, function () {
                                    settings.put(`${channel_name}-preferred-diagram`, {"diagram": match.diagram});
                                    preferred_diagram = {"diagram": match.diagram};
                                    alert.show(`Preferred diagram set for ${channel_name}`);
                                });
                            });
                        })();
                    }
                    $(`#${dropdown_id}`).append(`<div class="dropdown-divider"></div>`);
                }
                else {
                    $(`#${dropdown_id}`).append(`<h6 class="dropdown-header">No matching diagrams</h6>`);
                }
                const create_id = ui_util.makeid();
                $(`#${dropdown_id}`).append(`<a id="${create_id}" class="dropdown-item" href="#">Create new diagram</a>`);
                (function () {
                    $(`#${create_id}`).click(() => {
                        confirmation.show("Create a new diagram from this tile's contents?", function () {
                            const diagram = diagrams.add(
                                local_channel_name,
                                _.snakeCase(local_channel_name),
                                true
                            );
                            const callback = function () {
                                diagram.layout_horizontal(true);
                            };
                            diagram.statemachine.on("diagram-ready", callback);
                            // populate
                            const nodes = _.compact(model.nodes.get(node_ids));
                            diagram.nodes.update(nodes);
                            diagram.show();
                        });
                    });
                })();
            });
        })();
        const header_click_closure = function (
            hc_console,
            hc_name,
            hc_channel_members,
            hc_click_listeners
        ) {
            return function () {
                selection_listener(hc_name);
                $("#nav-data-tab").tab("show");
                for (let listener of hc_click_listeners) {
                    const local_listener = listener;
                    try {
                        local_listener(hc_name, hc_channel_members);
                    } catch (error) {
                        hc_console.log(error);
                    }
                }
            };
        };
        $("#" + header_id).on(
            "click",
            header_click_closure(
                console,
                local_channel_name,
                channel_members,
                click_listeners
            )
        );
        $("#" + header_id).dblclick(
            (function () {
                const name = local_channel_name;
                const members = channel_members;
                return function () {
                    show_edit_dialog(name, members);
                };
            })()
        );
    }
    sort_tiles();
    filter_tiles();
};

$("#view_tile_diagram_show").on("click", function () {
    const diagram_name = $("#view_tile_diagram_selected_diagram").val();
    const node_ids = JSON.parse(
        $("#view_tile_diagram_dialog").attr("data-node-ids")
    );
    const diagram = diagrams.get_by_name(diagram_name);
    diagram.network.once("afterDrawing", function () {
        diagram.network.fit({
            nodes: node_ids,
            animation: true,
        });
        diagram.blink(10, node_ids);
    });
    $("#view_tile_diagram_dialog").modal("hide");
    diagram.show();
});

$("#view_tile_diagram_generate_diagram_button").on("click", function () {
    const tile_name = filterXSS($("#view_tile_diagram_dialog").attr("data-tile-name"));
    const node_ids = JSON.parse(
        $("#view_tile_diagram_dialog").attr("data-node-ids")
    );
    const diagram = diagrams.add(tile_name, _.snakeCase(tile_name), true);
    // populate
    const nodes = _.compact(model.nodes.get(node_ids));
    diagram.nodes.update(nodes);
    // show
    diagram.show();
    $("#view_tile_diagram_dialog").modal("hide");
});

$("#save_channel_edit").on("click", function () {
    const edited_name = $("#channel_edit_name").val();
    const original_name = $("#channel_edit_name").attr("data-original-name");
    const member_checkboxes = $(
        "#channel_edit_members_table input[type='checkbox']"
    );
    channels
        .delete_channel(original_name)
        .then(function () {
            console.log("removed channel members");
            const members = [];
            for (let item of member_checkboxes) {
                if (item.checked === false) {
                    members.push(item.value);
                }
            }
            return channels.create_channel(edited_name, members);
        })
        .then(function () {
            console.log("added channel members");
            console.log(
                "channel " + original_name + " -> " + edited_name + " updated"
            );
            redraw_tiles();
        })
        .catch(function (error) {
            console.error(error);
        });
});

$("#tiles_duplicate_selected_tile_button").on("click", function () {
    const tile_name = selected();
    if (shown() && tile_name && tile_name !== "") {
        channels.retrieve_channel(tile_name).then(function (source_contents) {
            const source_node_ids = _.map(source_contents, "id").sort();
            channels_menu.show_quick_new_tile(source_node_ids);
        });
    }
});

$("#tiles_edit_selected_tile_button").on("click", function () {
    const tile_name = selected();
    if (shown() && tile_name && tile_name !== "") {
        channels.retrieve_channel(tile_name).then(function (contents) {
            show_edit_dialog(tile_name, contents);
        });
    }
});

$("#tiles_delete_selected_tile_button").on("click", function () {
    const tile_name = selected();
    if (shown() && tile_name && tile_name !== "") {
        let html = `Delete the tile named ${tile_name}?`;
        confirmation.show(html, function () {
            channels.delete_channel(tile_name).then(function () {
                redraw_tiles();
                alert.show("Tile deleted");
            });
        });
    }
});

const cache_update = redraw_tiles;

const load_update_interval = function () {
    return new Promise(function (resolve) {
        settings.get(settings_key).then(function (value) {
            const seconds = Number.parseInt(value);
            update_interval = seconds * 1000;
            resolve();
        });
    });
};

const set_update_interval = function (seconds) {
    // create a default
    update_interval = seconds * 1000;
    return settings.put(settings_key, seconds);
};

const schedule_interval = function () {
    if (intervalID) {
        clearInterval(intervalID);
    }
    intervalID = setInterval(cache_update, update_interval);
    console.log("tile view: interval scheduled " + update_interval + "ms");
};

const load_tile_view = function () {
    return new Promise(function (resolve) {
        settings.get(tile_view_key).then(function (value) {
            resolve(value);
        });
    });
};

const update_tile_view = function (tile_view) {
    return new Promise(function (resolve) {
        settings
            .put(tile_view_key, tile_view)
            .then(function () {
                console.log("tile view saved");
                resolve();
            })
            .catch(function (error) {
                console.error(error);
            });
    });
};

const update_filter_mode = function (text) {
    $("#tile-filter-dropdown").text(text);
};

$("#tile-filter-show-all").click(function () {
    const tile_filter_text = "Showing All Tiles";
    update_filter_mode(tile_filter_text);
    update_tile_view({
        show_alarm_tiles: true,
        show_normal_tiles: true,
        tile_filter_text: tile_filter_text,
    }).then(function () {
        update_tile_info();
    });
});

$("#tile-filter-show-alarm").click(function () {
    const tile_filter_text = "Showing Alarm/Alert Tiles";
    update_filter_mode(tile_filter_text);
    update_tile_view({
        show_alarm_tiles: true,
        show_normal_tiles: false,
        tile_filter_text: tile_filter_text,
    }).then(function () {
        update_tile_info();
    });
});

$("#tile-filter-show-normal").click(function () {
    const tile_filter_text = "Showing Normal Tiles";
    update_filter_mode(tile_filter_text);
    update_tile_view({
        show_alarm_tiles: false,
        show_normal_tiles: true,
        tile_filter_text: tile_filter_text,
    }).then(function () {
        update_tile_info();
    });
});

// check for any tiles, create a default if needed, finish initialization
channels
    .channel_list()
    .then(function (channel_list) {
        if (channel_list.length === 0) {
            channels.create_channel("Default", []).then(function () {
                redraw_tiles();
            });
        } else {
            redraw_tiles();
        }
        return load_update_interval();
    })
    .then(function () {
        schedule_interval();
        event_alerts.add_callback(event_alert_callback);
        alarms.add_callback(alarm_callback);
    });

const select_external = function (name) {
    scroll_to_tile(name);
    select(name);
};

const set_update_interval_external = function (seconds) {
    set_update_interval(seconds).then(function () {
        schedule_interval();
    });
};

const get_update_interval_external = function () {
    return update_interval;
};

const blink_external = function (name) {
    scroll_to_tile(name);
    blink(10, name);
};

export {
    add_selection_callback,
    redraw_tiles,
    update_tile_info,
    unselect,
    selected,
    shown,
    select_external as select,
    set_update_interval_external as set_update_interval,
    get_update_interval_external as get_update_interval,
    blink_external as blink,
};
