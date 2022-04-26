/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as connections from "../connections.js";
import * as regions from "../regions.js";
import * as util from "./util.js";
import * as api_check from "../api_check.js";
import * as settings from "../settings.js";
import * as confirmation from "./confirmation.js";

const history_to_buttons = function (history) {
    const local_jq = $;
    let index = 0;
    for (let item of history) {
        const id = util.makeid();
        const url = item[0];
        const apiKey = item[1];
        if (index == 0) {
            $("#input_endpoint_url").val(url);
            $("#input_endpoint_key").val(apiKey);
        }
        const html = `<a class="dropdown-item" id="${id}" href="#">${url}</a>`;
        $("#connectionHistoryDropdownMenu").append(html);
        // add event handlers to each item to populate dialog fields
        $("#" + id).click(
            (function () {
                let u = url;
                let k = apiKey;
                return function () {
                    local_jq("#input_endpoint_url").val(u);
                    local_jq("#input_endpoint_key").val(k);
                    local_jq("#connectionRemember").prop("checked", true);
                };
            })()
        );
        index++;
    }
};

const updateConnectionDialog = function () {
    const history = Array.from(connections.get_remembered());
    // clear the existing dropdown items
    $("#connectionHistoryDropdownMenu").empty();
    // replace with current history items
    if (history.length > 0) {
        $("#connectionHistoryMenuButton").removeClass("disabled");
        history_to_buttons(history);
    } else {
        $("#connectionHistoryMenuButton").addClass("disabled");
    }
    const current = connections.get_current();
    if (current) {
        $("#input_endpoint_url").val(current[0]);
        $("#input_endpoint_key").val(current[1]);
    }
};

const setConnectionAlert = function (message) {
    const html = `<div id="endpoint_connection_alert" class="m-3 alert alert-danger" role="alert">${message}</div>`;
    $("#endpoint_connection_alert").replaceWith(html);
};

const clearConnectionAlert = function () {
    const html = `<div id="endpoint_connection_alert"></div>`;
    $("#endpoint_connection_alert").replaceWith(html);
};

const setRegionSelectionAlert = function (message) {
    const html = `<div id="region_selection_alert" class="mx-3 mt-3 mb-1 alert alert-danger" role="alert">${message}</div>`;
    $("#region_selection_alert").replaceWith(html);
};

const clearRegionSelectionAlert = function () {
    const html = `<div id="region_selection_alert"></div>`;
    $("#region_selection_alert").replaceWith(html);
};

const showConnectionDialog = function () {
    updateConnectionDialog();
    $("#endpoint_connection_modal").modal("show");
};

const hideConnectionDialog = function () {
    updateConnectionDialog();
    $("#endpoint_connection_modal").modal("hide");
};

const setAdvancedSettingsAlert = function (message) {
    const html = `<div id="advanced_settings_modal_alert" class="m-3 alert alert-danger" role="alert">${message}</div>`;
    $("#advanced_settings_modal_alert").replaceWith(html);
};

const clearAdvancedSettingsAlert = function () {
    const html = `<div id="advanced_settings_modal_alert"></div>`;
    $("#advanced_settings_modal_alert").replaceWith(html);
};

const get_inventory_regions = function () {
    return new Promise(function (resolve) {
        settings.get("inventory-regions").then(function (data) {
            if (data == null) {
                data = [];
            }
            resolve(data);
        });
    });
};

const remove_inventory_regions_setting = (resolve) => {
    console.log("empty array, removing setting");
    settings.remove("inventory-regions").then(function () {
        resolve();
    });
};

const set_inventory_regions = function (inventory_regions) {
    console.log("updating inventory-regions: " + JSON.stringify(inventory_regions));
    return new Promise(function (resolve, reject) {
        if (!Array.isArray(inventory_regions)) {
            reject("regions must by an array");
        } else {
            if (inventory_regions.length == 1 && inventory_regions[0].length == 0) {
                remove_inventory_regions_setting(resolve);
            } else if (inventory_regions.length > 0) {
                settings
                    .put("inventory-regions", inventory_regions.sort())
                    .then(function () {
                        resolve();
                    });
            } else {
                remove_inventory_regions_setting(resolve);
            }
        }
    });
};

if (connections.get_current() !== null) {
    updateConnectionDialog();
}

// add a save handler for the connection dialog
$("#save_endpoint_connection").on("click", () => {
    try {
        // trim the string, normalize the link, remove any trailing slash
        const endpoint = filterXSS($("#input_endpoint_url").val().trim()).replace(/\/+$/, "");
        const apiKey = filterXSS($("#input_endpoint_key").val().trim());
        const store_locally = $("#connectionRemember").prop("checked");
        console.log("store locally = " + store_locally);
        // test the provided info before saving
        api_check
            .ping(endpoint, apiKey)
            .then(async function (response) {
                // test worked
                console.log(response);
                connections.set_current(endpoint, apiKey, store_locally);
                hideConnectionDialog();
                updateConnectionDialog();
                const statemachine = await import("../statemachine.js");
                statemachine.getToolStateMachine().connectionChanged();
            })
            .catch(function (error) {
                console.error(error);
                setConnectionAlert(
                    "There is a problem with this endpoint connection, please fix it"
                );
            });
    } catch (error) {
        console.log(error);
        setConnectionAlert(
            "There is a problem with this endpoint connection, please fix it"
        );
    }
    return true;
});

$("#connectionRemember").on("change", function () {
    const store_locally = $("#connectionRemember").prop("checked");
    console.log("store locally = " + store_locally);
});

$("#cancel_endpoint_connection").on("click", () => {
    console.log("cancel connection");
    const current_connection = connections.get_current();
    if (current_connection) {
        console.log("testing last connection used");
        // test current connection with api-ping
        const endpoint = current_connection[0];
        const api_key = current_connection[1];
        api_check
            .ping(endpoint, api_key)
            .then(function () {
                // test worked
                console.log("still working");
                hideConnectionDialog();
                import("../statemachine.js").then((statemachine) => {
                    statemachine.getToolStateMachine().connectionExists();
                });
            })
            .catch(function (error) {
                console.error("not working");
                console.error(error);
                setConnectionAlert(
                    "There is a problem with this endpoint connection, please fix it"
                );
                import("../statemachine.js").then((statemachine) => {
                    statemachine.getToolStateMachine().noSavedConnection();
                });
            });
    } else {
        setConnectionAlert(
            "You must define at least one endpoint connection to continue"
        );
    }
    return true;
});

// add a save handler for the region selection dialog
$("#save_region_selections").on("click", () => {
    regions
        .refresh()
        .then(function (module) {
            const toggles = $(".region-button");
            const selected = [];
            for (let button of toggles) {
                if (button.attributes["aria-pressed"].value == "true") {
                    selected.push(button.textContent);
                }
            }
            console.log(selected);
            if (selected.length === 0) {
                setRegionSelectionAlert(
                    "You must select at least one region to continue"
                );
            } else {
                module.set_selected(selected).then(function () {
                    console.log("we have at least one region selection");
                    clearRegionSelectionAlert();
                    console.log("region selections saved");
                    import("../statemachine.js").then((statemachine) => {
                        statemachine.getToolStateMachine().regionsChanged();
                    });
                });
            }
        })
        .catch(function (error) {
            console.error(error);
        });
    return true;
});

$("#cancel_region_selections").on("click", () => {
    console.log("cancel region selections");
    regions.refresh().then(function (module) {
        if (module.get_selected().length == 0) {
            setRegionSelectionAlert(
                "You must select at least one region to continue"
            );
        } else {
            console.log("we have at least one region selection");
            clearRegionSelectionAlert();
        }
    });
    return true;
});

$("#advanced_settings_button").on("click", async function () {
    try {
        clearAdvancedSettingsAlert();
        // get the current settings
        const alarm_interval = (
            await import("../alarms.js")
        ).get_update_interval();
        const event_interval = (
            await import("../events.js")
        ).get_update_interval();
        const tiles_interval = (
            await import("./tile_view.js")
        ).get_update_interval();
        const inventory_regions = await get_inventory_regions();
        const module = await regions.refresh();
        // populate the dialog
        $("#advanced-inventory-global").empty();
        $("#advanced-inventory-regions").empty();
        const all_regions = module.get_available();
        for (let item of all_regions) {
            const id = item.RegionName == "global" ? "#advanced-inventory-global" : "#advanced-inventory-regions";
            const checkbox = `<label class="border-0 mx-2" style="cursor: pointer;">
                    <input id="${util.makeid()}" type="checkbox" ${inventory_regions.indexOf(item.RegionName) != -1 ? "checked" : ""} value="${item.RegionName}">
                    ${item.RegionName == "global" ? "Global services (S3, CloudFront)" : item.RegionName}
                    </label > `;
            $(id).append(checkbox);
        }
        $("#advanced-alarm-update-interval").val(
            Math.round(alarm_interval / 1000)
        );
        $("#advanced-event-update-interval").val(
            Math.round(event_interval / 1000)
        );
        $("#advanced-tiles-refresh-interval").val(
            Math.round(tiles_interval / 1000)
        );
        // get the layout method and update the choice
        const value = await settings.get("layout-method");
        $("#layout-method-select option[value='" + value.method + "']").prop(
            "selected",
            true
        );
        // show it
        $("#advanced_settings_modal").modal("show");
    } catch (error) {
        console.error(error);
    }
});

$("#advanced_settings_modal_save").on("click", async function () {
    const alarm_interval = Number.parseInt(
        $("#advanced-alarm-update-interval").val()
    );
    const event_interval = Number.parseInt(
        $("#advanced-event-update-interval").val()
    );
    const tiles_interval = Number.parseInt(
        $("#advanced-tiles-refresh-interval").val()
    );
    const regions_array = _.map(
        $(
            "#advanced-inventory-regions input:checked,#advanced-inventory-global input:checked"
        ),
        "value"
    );
    // validate it
    if (Number.isNaN(alarm_interval)) {
        setAdvancedSettingsAlert(
            "Please check the CloudWatch Alarm Update Interval"
        );
    } else if (Number.isNaN(event_interval)) {
        setAdvancedSettingsAlert(
            "Please check the CloudWatch Event Update Interval"
        );
    } else if (Number.isNaN(tiles_interval)) {
        setAdvancedSettingsAlert(
            "Please check the Refresh Tile Inventory Interval"
        );
    } else if (!Array.isArray(regions_array)) {
        setAdvancedSettingsAlert("Please check the Inventory Regions input");
    } else {
        // clear any dialog alerts
        clearAdvancedSettingsAlert();
        // update modules with new values
        (await import("../alarms.js")).set_update_interval(alarm_interval);
        (await import("../events.js")).set_update_interval(event_interval);
        (await import("./tile_view.js")).set_update_interval(tiles_interval);
        set_inventory_regions(regions_array);
        // save layout method
        const method = $("#layout-method-select").val();
        console.log("layout-method is " + method);
        settings.put("layout-method", {
            method: method,
        });
        // hide it
        $("#advanced_settings_modal").modal("hide");
    }
});

$("#advanced_settings_modal_cancel").on("click", function () {
    // hide it
    $("#advanced_settings_modal").modal("hide");
});

// handlers for bulk deletion buttons in advanced settings

$("#bulk-delete-all-diagrams-button").click(async function () {
    $("#advanced_settings_modal").modal("hide");
    let diagrams = await settings.get("diagrams");
    let count = diagrams.length;
    confirmation.show(
        `< p > This action will delete ${count} diagram${count == 1 ? "" : "s"
        }. The browser will reload after completion.Continue ?</p > `,
        async function () {
            const layout = await import("./layout.js");
            layout.delete_all();
            window.location.reload();
        }
    );
});

$("#bulk-delete-all-tiles-button").click(async function () {
    $("#advanced_settings_modal").modal("hide");
    let channels = await settings.get("channels");
    let count = channels.length;
    confirmation.show(
        `< p > This action will delete ${count} tile${count == 1 ? "" : "s"
        }. The browser will reload after completion.Continue ?</p > `,
        async function () {
            (await import("../channels.js")).delete_all();
            window.location.reload();
        }
    );
});

$("#bulk-delete-all-alarm-subscriptions-button").click(async function () {
    $("#advanced_settings_modal").modal("hide");
    confirmation.show(
        "<p>This action will delete all alarm subscriptions in the tool. The browser will reload after completion. Continue?</p>",
        async function () {
            (await import("../alarms.js")).delete_all_subscribers();
            window.location.reload();
        }
    );
});

$("#bulk-delete-all-notes-button").click(async function () {
    $("#advanced_settings_modal").modal("hide");
    confirmation.show(
        "<p>This action will delete all notes associated with nodes, edges, and tiles. The browser will reload after completion. Continue?</p>",
        async function () {
            (await import("../notes.js")).delete_all_resource_notes();
            window.location.reload();
        }
    );
});

$("#bulk-delete-all-button").click(async function () {
    $("#advanced_settings_modal").modal("hide");
    let channels = await settings.get("channels");
    let channel_count = channels.length;
    let diagrams = await settings.get("diagrams");
    let diagram_count = diagrams.length;
    confirmation.show(
        `< p > This action will delete ${diagram_count} diagram${diagram_count == 1 ? "" : "s"
        }, ${channel_count} tile${channel_count == 1 ? "" : "s"
        }, and all alarm subscriptions in the tool.The browser will reload after completion.Continue ?</p > `,
        async function () {
            await Promise.all([
                (await import("./layout.js")).delete_all(),
                (await import("../channels.js")).delete_all(),
                (await import("../alarms.js")).delete_all_subscribers(),
                (await import("../notes.js")).delete_resource_notes()
            ]);
            window.location.reload();
        }
    );
});

// only update if we have a connection

export {
    showConnectionDialog,
    setConnectionAlert,
    clearConnectionAlert,
    set_inventory_regions,
    get_inventory_regions,
};
