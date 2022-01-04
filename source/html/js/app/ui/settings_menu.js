/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/connections", "app/regions", "app/ui/util", "app/api_check", "app/settings", "app/ui/confirmation", "app/channels"],
    function($, connections, regions_promise, util, api_check, settings, confirmation, channels) {

        const history_to_buttons = function(history) {
            const local_jq = $;
            let index = 0;
            for (let item of history) {
                // console.log(item);
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
                $("#" + id).click((function() {
                    let u = url;
                    let k = apiKey;
                    return function(event) {
                        local_jq("#input_endpoint_url").val(u);
                        local_jq("#input_endpoint_key").val(k);
                        local_jq("#connectionRemember").prop("checked", true);
        };
                })());
                index++;
            }
        };

        const updateConnectionDialog = function() {
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
            // $("#connectionRememberLabel").removeClass("active");
            // $("#connectionRemember").prop("checked", false);
            // $("#connectionRememberText").text("Do Not Remember");
        };

        const updateRegionDialog = function() {
            regions_promise().then(function(regions) {
                const selected = Array.from(regions.get_selected());
                const button_group = $("#region_toggles");
                button_group.empty();
                for (let region of regions.get_available()) {
                    const toggled = (selected.indexOf(region.RegionName) >= 0);
                    const button_html = '<button type="button" id="button_toggle_' + region.RegionName + '" class="region-button mx-3 my-1 btn btn-sm btn-outline-primary ' + (toggled ? " active" : "") + '" data-toggle="button" aria-pressed="' + toggled + '" autocomplete="off">' + region.RegionName + '</button><br>';
                    button_group.append(button_html);
                }
            }).catch(function(error) {
                console.log(error);
            });
        };

        // add a save handler for the connection dialog
        $("#save_endpoint_connection").on("click", () => {
            try {
                // trim the string, normalize the link, remove any trailing slash
                // endpoint = new URI($("#input_endpoint_url").val().trim()).normalize().replace(/\/+$/, "");
                endpoint = new URI($("#input_endpoint_url").val().trim()).normalize().toString().replace(/\/+$/, "");
                console.log("normalized to " + endpoint);
                apiKey = $("#input_endpoint_key").val().trim();
                store_locally = $("#connectionRemember").prop("checked");
                console.log("store locally = " + store_locally);
                // test the provided info before saving
                api_check.ping(endpoint, apiKey).then(function(response) {
                    // test worked
                    console.log(response);
                    connections.set_current(endpoint, apiKey, store_locally);
                    hideConnectionDialog();
                    updateConnectionDialog();
                    require("app/statemachine").getToolStateMachine().connectionChanged();
                }).catch(function(error) {
                    console.log(error);
                    setConnectionAlert("There is a problem with this endpoint connection, please fix it");
                });
            } catch (error) {
                console.log(error);
                setConnectionAlert("There is a problem with this endpoint connection, please fix it");
            }
            return true;
        });
        $("#connectionRemember").on("change", function() {
            store_locally = $("#connectionRemember").prop("checked");
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
                api_check.ping(endpoint, api_key).then(function(response) {
                    // test worked
                    console.log("still working");
                    hideConnectionDialog();
                    require("app/statemachine").getToolStateMachine().connectionExists();
                }).catch(function(error) {
                    console.log("not working");
                    setConnectionAlert("There is a problem with this endpoint connection, please fix it");
                    require("app/statemachine").getToolStateMachine().noSavedConnection();
                });
            } else {
                setConnectionAlert("You must define at least one endpoint connection to continue");
            }
            return true;
        });

        // add a save handler for the region selection dialog
        $("#save_region_selections").on("click", () => {
            regions_promise().then(function(regions) {
                const toggles = $('.region-button');
                const selected = [];
                for (let button of toggles) {
                    if (button.attributes['aria-pressed'].value == "true") {
                        selected.push(button.textContent);
                    }
                }
                console.log(selected);
                if (selected.length === 0) {
                    setRegionSelectionAlert("You must select at least one region to continue");
                } else {
                    regions.set_selected(selected).then(function() {
                        console.log("we have at least one region selection");
                        clearRegionSelectionAlert();
                        hideRegionSelectionDialog();
                        console.log("region selections saved");
                        require("app/statemachine").getToolStateMachine().regionsChanged();
                    });
                }
            }).catch(function(error) {
                console.log(error);
            });
            return true;
        });

        $("#cancel_region_selections").on("click", () => {
            console.log("cancel region selections");
            regions_promise().then(function(regions) {
                if (regions.get_selected().length == 0) {
                    setRegionSelectionAlert("You must select at least one region to continue");
                } else {
                    console.log("we have at least one region selection");
                    clearRegionSelectionAlert();
                    hideRegionSelectionDialog();
                }
            });
            return true;
        });

        const setConnectionAlert = function(message) {
            const html = `<div id="endpoint_connection_alert" class="m-3 alert alert-danger" role="alert">${message}</div>`;
            $("#endpoint_connection_alert").replaceWith(html);
        };

        const clearConnectionAlert = function() {
            const html = `<div id="endpoint_connection_alert"></div>`;
            $("#endpoint_connection_alert").replaceWith(html);
        };

        const setRegionSelectionAlert = function(message) {
            const html = `<div id="region_selection_alert" class="mx-3 mt-3 mb-1 alert alert-danger" role="alert">${message}</div>`;
            $("#region_selection_alert").replaceWith(html);
        };

        const clearRegionSelectionAlert = function() {
            const html = `<div id="region_selection_alert"></div>`;
            $("#region_selection_alert").replaceWith(html);
        };

        const showConnectionDialog = function() {
            updateConnectionDialog();
            $("#endpoint_connection_modal").modal('show');
        };

        const hideConnectionDialog = function() {
            updateConnectionDialog();
            $("#endpoint_connection_modal").modal('hide');
        };

        const showRegionSelectionDialog = function() {
            updateRegionDialog();
            $("#region_selection_modal").modal('show');
        };

        const hideRegionSelectionDialog = function() {
            updateRegionDialog();
            $("#region_selection_modal").modal('hide');
        };

        const setAdvancedSettingsAlert = function(message) {
            const html = `<div id="advanced_settings_modal_alert" class="m-3 alert alert-danger" role="alert">${message}</div>`;
            $("#advanced_settings_modal_alert").replaceWith(html);
        };

        const clearAdvancedSettingsAlert = function() {
            const html = `<div id="advanced_settings_modal_alert"></div>`;
            $("#advanced_settings_modal_alert").replaceWith(html);
        };

        const get_inventory_regions = function() {
            return new Promise(function(resolve, reject) {
                settings.get("inventory-regions").then(function(data) {
                    if (data == null) {
                        data = [];
                    }
                    resolve(data);
                });
            });
        };

        const set_inventory_regions = function(regions) {
            console.log("updating inventory-regions: " + JSON.stringify(regions));
            return new Promise(function(resolve, reject) {
                if (!Array.isArray(regions)) {
                    reject("regions must by an array");
                } else {
                    if (regions.length == 1 && regions[0].length == 0) {
                        console.log("empty array, removing setting");
                        settings.remove("inventory-regions").then(function() {
                            resolve();
                        });
                    } else
                    if (regions.length > 0) {
                        settings.put("inventory-regions", regions.sort()).then(function() {
                            resolve();
                        });
                    } else {
                        console.log("empty array, removing setting");
                        settings.remove("inventory-regions").then(function() {
                            resolve();
                        });
                    }
                }
            });
        };

        // only update if we have a connection
        if (connections.get_current() !== null) {
            updateConnectionDialog();
            updateRegionDialog();
        }

        $("#advanced_settings_button").on("click", function(event) {
            clearAdvancedSettingsAlert();
            // get the current settings
            alarm_interval = require("app/alarms").get_update_interval();
            event_interval = require("app/events").get_update_interval();
            tiles_interval = require("app/ui/tile_view").get_update_interval();
            get_inventory_regions().then(function(regions) {
                // populate the dialog
                $("#advanced-alarm-update-interval").val(Math.round(alarm_interval / 1000));
                $("#advanced-event-update-interval").val(Math.round(event_interval / 1000));
                $("#advanced-tiles-refresh-interval").val(Math.round(tiles_interval / 1000));
                // $("#advanced-inventory-regions").text(regions.sort().join(" "));
                // get the layout method
                return settings.get("layout-method");
            }).then(function(value) {
                $("#layout-method-select option[value='" + value.method + "']").prop("selected", true);
                // show it
                $("#advanced_settings_modal").modal('show');
            });
            return true;
        });

        $("#advanced_settings_modal_save").on("click", function(event) {
            alarm_interval = Number.parseInt($("#advanced-alarm-update-interval").val());
            event_interval = Number.parseInt($("#advanced-event-update-interval").val());
            tiles_interval = Number.parseInt($("#advanced-tiles-refresh-interval").val());
            regions = $("#advanced-inventory-regions").val();
            regions_array = regions.trim().split(/\s+/);
            // validate it
            if (Number.isNaN(alarm_interval)) {
                setAdvancedSettingsAlert("Please check the CloudWatch Alarm Update Interval");
            } else if (Number.isNaN(event_interval)) {
                setAdvancedSettingsAlert("Please check the CloudWatch Event Update Interval");
            } else if (Number.isNaN(tiles_interval)) {
                setAdvancedSettingsAlert("Please check the Refresh Tile Inventory Interval");
            } else if (!Array.isArray(regions_array)) {
                setAdvancedSettingsAlert("Please check the Never Cache Regions input");
            } else {
                // clear any dialog alerts
                clearAdvancedSettingsAlert();
                // update modules with new values
                require("app/alarms").set_update_interval(alarm_interval);
                require("app/events").set_update_interval(event_interval);
                require("app/ui/tile_view").set_update_interval(tiles_interval);
                set_inventory_regions(regions_array);
                // save layout method
                const method = $("#layout-method-select").val();
                console.log("layout-method is " + method);
                settings.put("layout-method", {
                    "method": method
                });
                // hide it
                $("#advanced_settings_modal").modal('hide');
            }
        });

        $("#advanced_settings_modal_cancel").on("click", function(event) {
            // hide it
            $("#advanced_settings_modal").modal('hide');
        });

        // handlers for bulk deletion buttons in advanced settings

        $("#bulk-delete-all-diagrams-button").click(async function(event) {
            $("#advanced_settings_modal").modal('hide');
            let diagrams = await settings.get("diagrams");
            let count = diagrams.length;
            confirmation.show(`<p>This action will delete ${count} diagram${(count == 1 ? "":"s")}. The browser will reload after completion. Continue?</p>`, async function() {
                await require("app/ui/layout").delete_all();
                window.location.reload();
            });
        });

        $("#bulk-delete-all-tiles-button").click(async function(event) {
            $("#advanced_settings_modal").modal('hide');
            let channels = await settings.get("channels");
            let count = channels.length;
            confirmation.show(`<p>This action will delete ${count} tile${(count == 1 ? "":"s")}. The browser will reload after completion. Continue?</p>`, async function() {
                await require("app/channels").delete_all();
                window.location.reload();
            });
        });

        $("#bulk-delete-all-alarm-subscriptions-button").click(async function(event) {
            $("#advanced_settings_modal").modal('hide');
            confirmation.show("<p>This action will delete all alarm subscriptions in the tool. The browser will reload after completion. Continue?</p>", async function() {
                await require("app/alarms").delete_all_subscribers();
                window.location.reload();
            });
        });

        $("#bulk-delete-all-button").click(async function(event) {
            $("#advanced_settings_modal").modal('hide');
            let channels = await settings.get("channels");
            let channel_count = channels.length;
            let diagrams = await settings.get("diagrams");
            let diagram_count = diagrams.length;
            confirmation.show(`<p>This action will delete ${diagram_count} diagram${(diagram_count == 1 ? "":"s")}, ${channel_count} tile${(channel_count == 1 ? "":"s")}, and all alarm subscriptions in the tool. The browser will reload after completion. Continue?</p>`, async function() {
                await Promise.all([require("app/ui/layout").delete_all(), require("app/channels").delete_all(), require("app/alarms").delete_all_subscribers()]);
                window.location.reload();
            });
        });

        // return the module object
        return {
            "showConnectionDialog": showConnectionDialog,
            "showRegionSelectionDialog": showRegionSelectionDialog,
            "setConnectionAlert": setConnectionAlert,
            "clearConnectionAlert": clearConnectionAlert,
            "set_inventory_regions": set_inventory_regions,
            "get_inventory_regions": get_inventory_regions
        };
    });