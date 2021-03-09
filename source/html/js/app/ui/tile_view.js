/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/channels", "app/model", "app/ui/util", "app/events", "app/alarms", "app/settings", "app/ui/diagrams", "lodash", "app/ui/confirmation", "app/ui/alert", "app/ui/channels_menu"],
    function($, channels, model, ui_util, event_alerts, alarms, settings, diagrams, _, confirmation, alert, channels_menu) {

        var tile_row_div_id = "channel-tile-row-zkjewrvwdqywhwx";

        var click_listeners = [];

        var tile_outer_div = "channel-tiles-outer";

        var content_div = "channel-tiles-diagram";

        var tab_id = "channel-tiles-tab";

        // interval in millis to check the cloud for tile changes
        var update_interval;

        var intervalID;

        var settings_key = "app-tile-update-interval";

        var tile_width_px = 240;
        var tile_height_px = 175;

        var current_channel_list = [];
        var current_channel_members = {};

        var tile_view_key = "tile-view";

        var add_selection_callback = function(callback) {
            if (!click_listeners.includes(callback)) {
                click_listeners.push(callback);
            }
        };

        var event_alert_callback = function() {
            update_tile_info();
        };

        var alarm_callback = function() {
            update_tile_info();
        };

        var selection_listener = function(name) {
            toggle_tile(name);
            // select(name);
        };

        var selected = function() {
            var tile = $(".selected-channel-tile");
            return tile.attr("data-channel-name");
        };

        var toggle_tile = function(name) {
            if (name === selected()) {
                unselect_all();
            } else {
                select(name);
            }
        };

        var blink = function(blinks, tile) {
            var interval_ms = 500;
            if (blinks > 0) {
                setTimeout(
                    function() {
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

        var scroll_to_tile = function(name) {
            // scroll to the selected item
            var query = `[data-channel-name='${name}']`;
            var selected = $(query);
            $("#" + tile_row_div_id).animate({
                scrollTop: selected.offset().top
            }, "slow");
        };

        var select = function(name) {
            // query = `[data-channel-name][data-channel-name!='${name}']`;
            var unselected_tiles = $(".selected-channel-tile");
            unselected_tiles.removeClass("selected-channel-tile");
            var query = `[data-channel-name='${name}']`;
            var selected_tile = $(query);
            selected_tile.addClass("selected-channel-tile");
        };

        var unselect = function(name) {
            var query = `[data-channel-name='${name}']`;
            var selected_tile = $(query);
            selected_tile.removeClass("selected-channel-tile");
        };

        var unselect_all = function() {
            var query = `[data-channel-name]`;
            var unselected_tiles = $(query);
            unselected_tiles.removeClass("selected-channel-tile");
        };

        var shown = function() {
            return $("#" + tab_id).attr("aria-selected") === "true";
        };

        function tab_alert(state) {
            if (state) {
                $("#channel-tiles-tab-icon").text("warning");
            } else {
                $("#channel-tiles-tab-icon").text("grid_on");
            }
        }

        var update_tile_info = async function() {
            // console.log("update_tile_info");
            var cached_events = event_alerts.get_cached_events();
            var cached_alarming_subscribers = alarms.get_subscribers_with_alarms();
            var channel_list = await channels.channel_list();
            for (let channel_name of channel_list) {
                var channel_members = await channels.retrieve_channel(channel_name);
                if (channel_members) {
                    var query = `[data-channel-name='${channel_name}']`;
                    var tile_id = $(query).attr("id");
                    var service_count_id = tile_id + "_services";
                    var event_count_id = tile_id + "_events";
                    var alarm_count_id = tile_id + "_alarms";
                    // console.log(channel_members);
                    var service_count = channel_members.length;
                    var alert_count = 0;
                    var alarm_count = 0;
                    var border_class = "border-success";
                    for (let member of channel_members) {
                        filtered_events = _.filter(cached_events.current, { resource_arn: member.id });
                        alert_count += filtered_events.length;
                        filtered_alarms = _.filter(cached_alarming_subscribers.current, { ResourceArn: member.id });
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
                    $("#" + tile_id).addClass(border_class);
                    $("#" + service_count_id).html(`${service_count} cloud services`);
                    $("#" + event_count_id).html(`${alert_count} alert event${(alert_count === 1 ? "" : "s")}`);
                    $("#" + alarm_count_id).html(`${alarm_count} alarm${(alarm_count === 1 ? "" : "s")}`);
                }
            }
            sort_tiles();
            filter_tiles();
        };

        var sort_tiles = function() {
            var tiles = $("[data-channel-name]");
            tiles.sort(function(a, b) {
                var compare = 0;
                var compA = Number.parseInt($(a).attr("data-alert-count")) + Number.parseInt($(a).attr("data-alarm-count"));
                var compB = Number.parseInt($(b).attr("data-alert-count")) + Number.parseInt($(b).attr("data-alarm-count"));
                compare = (compA < compB ? 1 : (compA > compB ? -1 : 0));
                if (compare === 0) {
                    compA = $(a).attr("data-channel-name");
                    compB = $(b).attr("data-channel-name");
                    compare = (compA < compB ? -1 : (compA > compB ? 1 : 0));
                }
                return compare;
            });
            for (let tile of tiles) {
                $("[data-tile-row]").append(tile);
            }
        };

        var filter_tiles = function() {
            let tiles = $("[data-channel-name]");
            load_tile_view().then(function(tile_settings) {
                update_filter_mode(tile_settings.tile_filter_text);
                var show_alarm_tiles = tile_settings.show_alarm_tiles;
                var show_normal_tiles = tile_settings.show_normal_tiles;
                for (let tile of tiles) {
                    var total = (Number.parseInt($(tile).attr("data-alert-count")) + Number.parseInt($(tile).attr("data-alarm-count")));
                    var alarming = (total > 0);
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

        var redraw_tiles = async function() {
            $("#" + tile_outer_div).addClass("d-none");
            $("#" + content_div).html(`<div id="${tile_row_div_id}" data-tile-row="true" class="row ml-3">`);
            var channel_list = await channels.channel_list();
            var cached_events = event_alerts.get_cached_events();
            var cached_alarming_subscribers = alarms.get_subscribers_with_alarms();
            for (let channel_name of channel_list) {
                var border_class = "border-success";
                var channel_members = await channels.retrieve_channel(channel_name);
                // console.log(channel_members);
                var service_count = channel_members.length;
                var alert_count = 0;
                var alarm_count = 0;
                for (let member of channel_members) {
                    filtered_events = _.filter(cached_events.current, { resource_arn: member.id });
                    alert_count += filtered_events.length;
                    filtered_alarms = _.filter(cached_alarming_subscribers.current, { ResourceArn: member.id });
                    alarm_count += filtered_alarms.length;
                }
                if (alert_count + alarm_count) {
                    border_class = "border-danger";
                }
                if (channel_name == selected()) {
                    border_class = `${border_class} selected-channel-tile`;
                }
                var channel_card_id = ui_util.makeid();
                var model_button_id = channel_card_id + "_model_button";
                var header_id = channel_card_id + "_header";
                var tile = `
                        <div draggable="true" class="card ${border_class} ml-4 mb-4" id="${channel_card_id}" data-alert-count="${alert_count}" data-alarm-count="${alarm_count}" data-channel-name="${channel_name}" data-tile-name="${channel_name}" style="border-width: 3px; width: ${tile_width_px}px; min-width: ${tile_width_px}px; max-width: ${tile_width_px}px; height: ${tile_height_px}px; min-height: ${tile_height_px}px; max-height: ${tile_height_px}px;">
                            <div class="card-header" style="cursor: pointer;" title="Click to Select, Doubleclick to Edit" id="${header_id}">${channel_name}</div>
                            <div class="card-body text-info my-0 py-1">
                                <h5 class="card-title my-0 py-0" id="${channel_card_id}_events">${alert_count} alert event${(alert_count === 1 ? "" : "s")}</h5>
                                <h5 class="card-title my-0 py-0" id="${channel_card_id}_alarms">${alarm_count} alarm${(alarm_count === 1 ? "" : "s")}</h5>
                                <p class="card-text small my-0 py-0" id="${channel_card_id}_services">${service_count} cloud services</p>
                            </div>
                            <div class="btn-group btn-group-sm mb-1 mx-auto" role="group" aria-label="Tile Buttons">
                                <button type="button" id="${model_button_id}" title="Navigate to Diagram" class="btn btn-light px-2">Diagram</button>
                            </div>
                        </div>
                    `;
                $("#" + tile_row_div_id).append(tile);
                var header_click_closure = function() {
                    var name = channel_name;
                    var members = channel_members;
                    return function() {
                        selection_listener(name, members);
                        for (let f of click_listeners) {
                            new Promise((resolve, reject) => {
                                try {
                                    f(name, members);
                                } catch (error) {
                                    console.log(error);
                                }
                            });
                        }
                    };
                };
                $("#" + header_id).on("click", header_click_closure());
                $("#" + header_id).dblclick((function() {
                    var name = channel_name;
                    var members = channel_members;
                    return function() {
                        show_edit_dialog(name, members);
                    };
                })());
                var model_click_closure = function() {
                    var tile_name = channel_name;
                    var node_ids = _.map(channel_members, "id");
                    return function() {
                        var html;
                        var matches = diagrams.have_all(node_ids);
                        // show tile diagram dialog
                        $("#view_tile_diagram_selected_diagram").empty();
                        if (node_ids.length === 0) {
                            alert.show("Add resources to the tile");
                        } else
                        if (matches.length === 0) {
                            html = `This tile's contents were not found on any diagram. Would you like to generate a new one?`;
                            confirmation.show(html, function() {
                                var diagram = diagrams.add(tile_name, _.snakeCase(tile_name), true);
                                // populate
                                var nodes = _.compact(model.nodes.get(node_ids));
                                diagram.nodes.update(nodes);
                                diagram.show();
                            });
                        } else {
                            for (let diagram of matches) {
                                html = `<option value="${diagram.name}">${diagram.name}</option>`;
                                $("#view_tile_diagram_selected_diagram").append(html);
                            }
                            $("#view_tile_diagram_dialog").attr("data-node-ids", JSON.stringify(node_ids));
                            $("#view_tile_diagram_dialog").attr("data-tile-name", tile_name);
                            $("#view_tile_diagram_dialog").modal("show");
                        }
                    };
                };
                $("#" + model_button_id).on("click", model_click_closure());
            }
            sort_tiles();
            filter_tiles();
        };

        function show_edit_dialog(name, members) {
            // console.log(members);
            $("#channel_edit_name").val(name);
            $("#channel_edit_name").attr("data-original-name", name);
            $("#channel_edit_modal_items").empty();
            var channel_content = "";
            let index = 0;
            for (let member of members) {
                var node = model.nodes.get(member.id);
                // var data = JSON.stringify(node.data);
                var checkbox_id = ui_util.makeid();
                if (node) {
                    channel_content += `
                                        <tr><th scope="row">${index+1}</th>
                                        <td>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="checkbox" id="${checkbox_id}" value="${member.id}">
                                        </div>
                                        </td>
                                        <td>${node.title}</td><td>${node.id}</td></tr>
                                    `;
                } else {
                    channel_content += `
                                        <tr><th scope="row">${index+1}</th>
                                        <td>
                                        <div class="form-check form-check-inline">
                                            <input class="form-check-input" type="checkbox" id="${checkbox_id}" value="${member.id}">
                                        </div>
                                        </td>
                                        <td>Expired</td><td>Expired</td></tr>
                                    `;
                }
                index++;
            }
            var html = `
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
        }

        $("#view_tile_diagram_show").on("click", function() {
            var diagram_name = $("#view_tile_diagram_selected_diagram").val();
            var node_ids = JSON.parse($("#view_tile_diagram_dialog").attr("data-node-ids"));
            var diagram = diagrams.get_by_name(diagram_name);
            diagram.network.once("afterDrawing", function() {
                diagram.network.fit({
                    nodes: node_ids,
                    animation: true
                });
                diagram.blink(10, node_ids);
            });
            $("#view_tile_diagram_dialog").modal("hide");
            diagram.show();
        });

        $("#view_tile_diagram_generate_diagram_button").on("click", function() {
            var tile_name = $("#view_tile_diagram_dialog").attr("data-tile-name");
            var node_ids = JSON.parse($("#view_tile_diagram_dialog").attr("data-node-ids"));
            var diagram = diagrams.add(tile_name, _.snakeCase(tile_name), true);
            // populate
            var nodes = _.compact(model.nodes.get(node_ids));
            diagram.nodes.update(nodes);
            // diagram.network.once("afterDrawing", function() {
            //     // layout
            //     diagram.layout_vertical(true);
            // });
            // show
            diagram.show();
            $("#view_tile_diagram_dialog").modal("hide");
        });

        $("#save_channel_edit").on("click", function() {
            var edited_name = $("#channel_edit_name").val();
            // console.log(edited_name);
            var original_name = $("#channel_edit_name").attr("data-original-name");
            // console.log(original_name);
            var member_checkboxes = $("#channel_edit_members_table input[type='checkbox']");
            // console.log(member_checkboxes);
            channels.delete_channel(original_name).then(function() {
                console.log("removed channel members");
                var members = [];
                for (let item of member_checkboxes) {
                    if (item.checked === false) {
                        members.push(item.value);
                    }
                }
                return channels.create_channel(edited_name, members);
            }).then(function() {
                console.log("added channel members");
                console.log("channel " + original_name + " -> " + edited_name + " updated");
                redraw_tiles();
            }).catch(function(error) {
                console.log(error);
            });
        });

        $("#tiles_duplicate_selected_tile_button").on("click", function() {
            var tile_name = selected();
            if (shown() && tile_name && tile_name !== "") {
                channels.retrieve_channel(tile_name).then(function(source_contents) {
                    source_node_ids = _.map(source_contents, "id").sort();
                    channels_menu.show_quick_new_tile(source_node_ids);
                });
            }
        });

        $("#tiles_edit_selected_tile_button").on("click", function() {
            var tile_name = selected();
            if (shown() && tile_name && tile_name !== "") {
                channels.retrieve_channel(tile_name).then(function(contents) {
                    show_edit_dialog(tile_name, contents);
                });
            }
        });

        $("#tiles_delete_selected_tile_button").on("click", function() {
            var tile_name = selected();
            if (shown() && tile_name && tile_name !== "") {
                $("#confirmation_dialog_proceed").on("click", function(event) {
                    channels.delete_channel(tile_name).then(function(response) {
                        redraw_tiles();
                    });
                });
                $("#confirmation_dialog").on("hide.bs.modal", function(event) {
                    console.log(event);
                    $("#confirmation_dialog_proceed").unbind("click");
                });
                $("#confirmation_dialog_body").html("<p>Delete the tile named " + tile_name + "?</p>");
                $("#confirmation_dialog").modal("show");

            }
        });

        var cache_update = redraw_tiles;

        var load_update_interval = function() {
            return new Promise(function(resolve) {
                settings.get(settings_key).then(function(value) {
                    var seconds = Number.parseInt(value);
                    update_interval = seconds * 1000;
                    resolve();
                });
            });
        };

        var set_update_interval = function(seconds) {
            // create a default
            update_interval = seconds * 1000;
            return settings.put(settings_key, seconds);
        };

        var schedule_interval = function() {
            if (intervalID) {
                clearInterval(intervalID);
            }
            intervalID = setInterval(cache_update, update_interval);
            console.log("tile view: interval scheduled " + update_interval + "ms");
        };

        var load_tile_view = function() {
            return new Promise(function(resolve) {
                settings.get(tile_view_key).then(function(value) {
                    resolve(value);
                });
            });
        };

        var update_tile_view = function(tile_view) {
            return new Promise(function(resolve) {
                settings.put(tile_view_key, tile_view).then(function() {
                    console.log("tile view saved");
                    resolve();
                }).catch(function(error) {
                    console.log(error);
                });
            });
        };

        var update_filter_mode = function(text) {
            $("#tile-filter-dropdown").text(text);
        };

        $("#tile-filter-show-all").click(function(event) {
            var tile_filter_text = "Showing All Tiles";
            update_filter_mode(tile_filter_text);
            update_tile_view({ "show_alarm_tiles": true, "show_normal_tiles": true, "tile_filter_text": tile_filter_text }).then(function() {
                update_tile_info();
            });
        });

        $("#tile-filter-show-alarm").click(function(event) {
            var tile_filter_text = "Showing Alarm/Alert Tiles";
            update_filter_mode(tile_filter_text);
            update_tile_view({ "show_alarm_tiles": true, "show_normal_tiles": false, "tile_filter_text": tile_filter_text }).then(function() {
                update_tile_info();
            });
        });

        $("#tile-filter-show-normal").click(function(event) {
            var tile_filter_text = "Showing Normal Tiles";
            update_filter_mode(tile_filter_text);
            update_tile_view({ "show_alarm_tiles": false, "show_normal_tiles": true, "tile_filter_text": tile_filter_text }).then(function() {
                update_tile_info();
            });
        });

        // check for any tiles, create a default if needed, finish initialization
        channels.channel_list().then(function(channel_list) {
            if (channel_list.length === 0) {
                channels.create_channel("Default", []).then(function() {
                    redraw_tiles();
                });
            } else {
                redraw_tiles();
            }
            return load_update_interval();
        }).then(function() {
            schedule_interval();
            event_alerts.add_callback(event_alert_callback);
            alarms.add_callback(alarm_callback);
            // add_selection_callback(selection_listener);
        });

        return {
            "add_selection_callback": add_selection_callback,
            "redraw_tiles": redraw_tiles,
            "update_tile_info": update_tile_info,
            "select": function(name) {
                scroll_to_tile(name);
                select(name);
            },
            "unselect": unselect,
            "selected": selected,
            "set_update_interval": function(seconds) {
                set_update_interval(seconds).then(function() {
                    schedule_interval();
                });
            },
            "get_update_interval": function() {
                return update_interval;
            },
            "blink": function(name) {
                scroll_to_tile(name);
                blink(10, name);
            },
            "shown": shown
        };
    });