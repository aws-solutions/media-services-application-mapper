/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/channels", "app/model", "app/ui/util", "app/events", "app/alarms", "app/settings"],
    function($, _, channels, model, ui_util, event_alerts, alarms, settings) {

        var tile_row_div_id = "channel-tile-row-zkjewrvwdqywhwx";

        var selected_tile_name = "";
        var selected_tile;

        var click_listeners = [];

        var content_div = "channel-tiles-diagram";

        // interval in millis to check the cloud for tile changes
        var update_interval;

        var intervalID;

        var settings_key = "app-tile-update-interval";

        var tile_width_px = 240;
        var tile_height_px = 175;

        var current_channel_list = [];
        var current_channel_members = {};

        var add_click_listener = function(callback) {
            if (!click_listeners.includes(callback)) {
                click_listeners.push(callback);
            }
        };

        var event_alert_callback = function(current_alerts, previous_alerts) {
            update_tile_info();
        };

        var alarm_callback = function(current_alarming_ids, previous_alarming_ids) {
            update_tile_info();
        };

        var selection_listener = function(name) {
            toggle_tile(name);
        };

        var toggle_tile = function(name) {
            if (name == selected_tile_name) {
                unselect_all()
            } else {
                select_tile(name);
            }
        };

        var scroll_to_tile = function(name) {
            // scroll to the selected item
            $("#" + tile_row_div_id).animate({
                scrollTop: selected_tile.offset().top
            }, "slow");
        };

        var select_tile = function(name) {
            selected_tile_name = name;
            var query = `[data-channel-name='${name}']`;
            selected_tile = $(query);
            selected_tile.addClass("selected-channel-tile");
            query = `[data-channel-name][data-channel-name!='${name}']`;
            var unselected_tiles = $(query);
            unselected_tiles.removeClass("selected-channel-tile");
        }

        var unselect_all = function() {
            selected_tile = undefined;
            selected_tile_name = "";
            query = `[data-channel-name]`;
            var unselected_tiles = $(query);
            unselected_tiles.removeClass("selected-channel-tile");
        }

        var update_tile_info = function() {
            var cached_events = event_alerts.get_cached_events();
            var cached_alarming_subscribers = alarms.get_subscribers_with_alarms();
            $.each(current_channel_list, function(channel_index, channel_name) {
                channel_members = current_channel_members[channel_name];
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
                    $.each(channel_members, function(member_index, member) {
                        $.each(cached_events.current, function(event_index, event_value) {
                            if (member.id === event_value.resource_arn) {
                                border_class = "border-danger";
                                alert_count++;
                            }
                        });
                        $.each(cached_alarming_subscribers.current, function(alarm_index, alarm_value) {
                            if (member.id === alarm_value.ResourceArn) {
                                border_class = "border-danger";
                                alarm_count++;
                            }
                        });

                    });
                    if (border_class == "border-success") {
                        $("#" + tile_id).removeClass("border-danger");
                    } else {
                        $("#" + tile_id).removeClass("border-success");
                    }
                    $("#" + tile_id).attr("data-alert-count", alert_count);
                    $("#" + tile_id).attr("data-alarm-count", alarm_count);
                    $("#" + tile_id).addClass(border_class);
                    $("#" + service_count_id).html(`${service_count} cloud services`);
                    $("#" + event_count_id).html(`${alert_count} alert event${alert_count == 1 ? "" : "s"}`);
                    $("#" + alarm_count_id).html(`${alarm_count} alarm${alarm_count == 1 ? "" : "s"}`);
                }
            });
            sort_tiles();
        };

        var sort_tiles = function() {
            var tiles = $("[data-channel-name]");
            tiles.sort(function(a, b) {
                var compare = 0;
                var compA = Number.parseInt($(a).attr("data-alert-count")) + Number.parseInt($(a).attr("data-alarm-count"));
                var compB = Number.parseInt($(b).attr("data-alert-count")) + Number.parseInt($(b).attr("data-alarm-count"));
                compare = (compA < compB) ? 1 : (compA > compB) ? -1 : 0;
                if (compare == 0) {
                    compA = $(a).attr("data-channel-name");
                    compB = $(b).attr("data-channel-name");
                    compare = (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
                }
                return compare;
            });
            $.each(tiles, function(index, tile) {
                $("[data-tile-row]").append(tile);
            });
        };

        var redraw_tiles = function() {
            current_channel_list = [];
            current_channel_members = {};
            // $("#" + content_div).empty();
            $("#" + content_div).html(`<div id="${tile_row_div_id}" data-tile-row="true" class="row ml-3">`);
            new Promise(function(outerResolve, outerReject) {
                channels.channel_list().then(function(channel_list) {
                    // console.log(channel_list);
                    current_channel_list = channel_list;
                    var cached_events = event_alerts.get_cached_events();
                    var cached_alarming_subscribers = alarms.get_subscribers_with_alarms();
                    $.each(channel_list, function(channel_index, channel_name) {
                        var border_class = "border-success";
                        channels.retrieve_channel(channel_name).then(function(channel_members) {
                            // console.log(channel_members);
                            current_channel_members[channel_name] = channel_members;
                            var service_count = channel_members.length;
                            var alert_count = 0;
                            var alarm_count = 0;
                            $.each(channel_members, function(member_index, member) {
                                $.each(cached_events.current, function(event_index, event_value) {
                                    if (member.id === event_value.resource_arn) {
                                        border_class = "border-danger";
                                        alert_count++;
                                    }
                                });
                                $.each(cached_alarming_subscribers.current, function(alarm_index, alarm_value) {
                                    if (member.id === alarm_value.ResourceArn) {
                                        border_class = "border-danger";
                                        alarm_count++;
                                    }
                                });
                            });
                            if (channel_name == selected_tile_name) {
                                border_class = border_class + " selected-channel-tile";
                            }
                            var channel_card_id = ui_util.makeid();
                            var model_button_id = channel_card_id + "_model_button";
                            var delete_button_id = channel_card_id + "_delete_button";
                            var edit_button_id = channel_card_id + "_edit_button";
                            var header_id = channel_card_id + "_header";
                            var tile = `
                                <div class="card ${border_class} ml-4 my-3" id="${channel_card_id}" data-alert-count="${alert_count}" data-alarm-count="${alarm_count}" data-channel-name="${channel_name}" style="border-width: 3px; width: ${tile_width_px}px; min-width: ${tile_width_px}px; max-width: ${tile_width_px}px; height: ${tile_height_px}px; min-height: ${tile_height_px}px; max-height: ${tile_height_px}px;">
                                    <div class="card-header" style="cursor: pointer;" id="${header_id}">${channel_name}</div>
                                    <div class="card-body text-info my-0 py-1">
                                        <h5 class="card-title my-0 py-0" id="${channel_card_id}_events">${alert_count} alert event${alert_count == 1 ? "" : "s"}</h5>
                                        <h5 class="card-title my-0 py-0" id="${channel_card_id}_alarms">${alarm_count} alarm${alarm_count == 1 ? "" : "s"}</h5>
                                        <p class="card-text small my-0 py-0" id="${channel_card_id}_services">${service_count} cloud services</p>
                                    </div>
                                    <div class="btn-group btn-group-sm mb-1 mx-auto" role="group" aria-label="Basic example">
                                        <button type="button" id="${model_button_id}" class="btn btn-secondary"><small>Detailed Model</small></button>
                                        <button type="button" id="${edit_button_id}" class="btn btn-secondary"><small>Edit</small></button>
                                        <button type="button" id="${delete_button_id}" class="btn btn-secondary"><small>Delete</small></button>
                                    </div>
                                </div>
                            `;
                            $("#" + tile_row_div_id).append(tile);
                            $("#" + header_id).on("click", (function() {
                                var name = channel_name;
                                var members = channel_members;
                                return function(event) {
                                    click_listeners.forEach(function(f) {
                                        f(name, members);
                                    });
                                }
                            })());
                            $("#" + model_button_id).on("click", (function() {
                                var name = channel_name;
                                var members = channel_members;
                                return function(event) {
                                    require("app/ui/global_view").show();
                                    var node_ids = [];
                                    $.each(members, function(i, member) {
                                        node_ids.push(member.id);
                                    });
                                    require("app/ui/search_view").set_node_filter(name, node_ids);
                                }
                            })());
                            $("#" + edit_button_id).on("click", (function() {
                                var name = channel_name;
                                var members = channel_members;
                                return function(event) {
                                    // console.log(members);
                                    $("#channel_edit_name").val(name);
                                    $("#channel_edit_name").attr("data-original-name", name);
                                    $("#channel_edit_modal_items").empty();
                                    var channel_content = "";
                                    $.each(members, function(index, member) {
                                        var node = model.nodes.get(member.id);
                                        // var data = JSON.stringify(node.data);
                                        var checkbox_id = ui_util.makeid();
                                        channel_content += `
                                                <tr><th scope="row">${index+1}</th>
                                                <td>
                                                <div class="form-check form-check-inline">
                                                    <input class="form-check-input" type="checkbox" id="${checkbox_id}" value="${member.id}">
                                                </div>
                                                </td>
                                                <td>${node.title}</td><td>${node.id}</td></tr>
                                            `;
                                    });
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
                                    $("#channel_edit_modal").modal('show');
                                }
                            })());
                            $("#" + delete_button_id).on("click", function(event) {
                                var local_name = channel_name;
                                console.log(event);
                                $("#confirmation_dialog_proceed").on("click", function(event) {
                                    console.log(event);
                                    channels.delete_channel(local_name).then(function(response) {
                                        console.log(response);
                                        redraw_tiles();
                                    });
                                });
                                $("#confirmation_dialog").on("hide.bs.modal", function(event) {
                                    console.log(event);
                                    $("#confirmation_dialog_proceed").unbind("click");
                                });
                                $("#confirmation_dialog_body").html("<p>Delete the channel tile named " + channel_name + "?</p>");
                                $("#confirmation_dialog").modal('show');
                            });
                            var tile_count = $("#" + tile_row_div_id + " > .card").length;
                            if (tile_count == channel_list.length) {
                                outerResolve();
                            }
                        }).catch(function(error) {
                            console.log(error);
                        });
                    });
                }).catch(function(error) {
                    console.log(error);
                });
            }).then(function() {
                sort_tiles();
            });

        };

        $("#save_channel_edit").on("click", function(event) {
            var edited_name = $("#channel_edit_name").val();
            // console.log(edited_name);
            var original_name = $("#channel_edit_name").attr("data-original-name");
            // console.log(original_name);
            var member_checkboxes = $("#channel_edit_members_table input[type='checkbox']");
            // console.log(member_checkboxes);
            channels.delete_channel(original_name).then(function() {
                console.log("removed channel members");
                var members = [];
                $.each(member_checkboxes, function(index, item) {
                    if (item.checked == false) {
                        members.push(item.value);
                    }
                });
                return channels.create_channel(edited_name, members);
            }).then(function() {
                console.log("added channel members");
                console.log("channel " + original_name + " -> " + edited_name + " updated");
                redraw_tiles();
            }).catch(function(error) {
                console.log(error);
            });
        });

        var cache_update = redraw_tiles;

        var load_update_interval = function() {
            return new Promise(function(resolve, reject) {
                settings.get(settings_key).then(function(value) {
                    seconds = Number.parseInt(value);
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

        load_update_interval().then(function() {
            schedule_interval();
        });

        redraw_tiles();

        event_alerts.add_listener(event_alert_callback);
        alarms.add_listener(alarm_callback);

        add_click_listener(selection_listener);

        return {
            "add_click_listener": add_click_listener,
            "redraw_tiles": redraw_tiles,
            "select_tile": function(name) {
                select_tile(name);
                scroll_to_tile(name);
            },
            "get_selected_tile_name": function() {
                return selected_tile_name;
            },
            "set_update_interval": function(seconds) {
                set_update_interval(seconds).then(function() {
                    schedule_interval();
                });
            },
            "get_update_interval": function() {
                return update_interval;
            }
        };
    });