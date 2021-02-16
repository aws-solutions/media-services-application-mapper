/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/alarms", "app/regions", "app/ui/alert", "app/ui/diagrams", "app/ui/tile_view", "app/channels"],
    function($, _, model, alarms, regions_promise, alert, diagrams, tile_view, channels) {

        var set_progress_message = function(message) {
            $("#subscribe_to_alarms_progress").html(message);
        };

        var alarms_tabulator = new Tabulator("#subscribe_to_alarms_modal_alarm_selection", {
            placeholder: "No Alarms to Show",
            tooltips: true,
            height: 400, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
            layout: "fitColumns", //fit columns to width of table (optional)
            selectable: true,
            selectableRangeMode: "click",
            columns: [ //Define Table Columns
                {
                    title: "Alarm",
                    field: "AlarmName",
                    headerFilter: true
                }, {
                    title: "Namespace",
                    field: "Namespace",
                    headerFilter: true
                }, {
                    title: "Metric",
                    field: "MetricName",
                    headerFilter: true
                }, {
                    title: "State",
                    field: "StateValue",
                    headerFilter: true
                },
            ],
            rowSelectionChanged: function(data, rows) {
                //update selected row counter on selection change
                selected_alarm_data = data;
                $("#subscribe_to_alarms_modal_alarm_selection_count").text(data.length);
                var diagram = diagrams.shown();
                if (diagram) {
                    subscribe_save_button(diagram.network.getSelectedNodes().length > 0 && data.length > 0);
                }
            },
        });

        var nodes_tabulator = new Tabulator("#subscribe_to_alarms_modal_selected_items", {
            placeholder: "No Model Items Selected",
            tooltips: true,
            selectable: false,
            height: 200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
            layout: "fitColumns", //fit columns to width of table (optional)
            columns: [ //Define Table Columns
                {
                    title: "Type",
                    field: "title"
                }, {
                    title: "Name",
                    field: "name"
                }, {
                    title: "ARN",
                    field: "id"
                }
            ]
        });

        var selected_alarm_data;
        var selected_alarm_region;

        var progress_value = 0;
        var progress_start_time = 0;
        var progress_timer_id = 0;

        var progress_bar_html = function(value, text, color_class) {
            var html = `<div class="m-2"><div class="progress"><div class="progress-bar ${color_class}" role="progressbar" style="width: ${value}%" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100">${text}</div></div></div>`;
            return html;
        };

        var start_progress_message = function() {
            end_progress_message();
            progress_value = 0;
            progress_start_time = new Date().getTime();
            progress_timer_id = setInterval(function() {
                update_progress_message();
            }, 500);
            update_progress_message();
        };

        var update_progress_message = function() {
            var delta_ms = (new Date().getTime()) - progress_start_time;
            var progress_duration_seconds = Math.round(delta_ms / 1000);
            var html = progress_bar_html(progress_value, `Loading alarms (${progress_duration_seconds}s)`, "bg-warning");
            set_progress_message(html);
            progress_value += 5;
            if (progress_value > 100) {
                progress_value = 0;
            }
        };

        var end_progress_message = function() {
            if (progress_timer_id) {
                clearInterval(progress_timer_id);
            }
        };

        var populate_alarms_from_region = function(region) {
            selected_alarm_region = region;
            start_progress_message();
            $("#subscribe_to_alarms_modal_alarm_selection_count").text("0");
            alarms_tabulator.clearData();
            alarms.all_alarms_for_region(region).then(function(response) {
                end_progress_message();
                var html = progress_bar_html(100, `${response.length} alarm${response.length != 1 ? "s" : "" } in this region`, "bg-success");
                set_progress_message(html);
                if (response.length > 0) {
                    alarms_tabulator.setData(response);
                }
            }).catch(function(error) {
                end_progress_message();
                var html = progress_bar_html(100, `${error}`, "bg-danger");
                set_progress_message(html);
            });
        };

        var populate_selected_items = function(node_ids) {
            var data = _.compact(model.nodes.get(node_ids));
            // placed a scrubbed list of node ids on the dialog as a data attribute
            $("#subscribe_to_alarms_modal").attr("data-node-ids", JSON.stringify(_.map(data, "id")));
            // $("#subscribe_to_alarms_modal_selected_items").tabulator("setData", data);
            nodes_tabulator.setData(data);
        };

        var subscribe_save_button = function(enable) {
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
        }

        $("#alarms_subscribe_button").on("click", function(event) {
            show_alarm_subscribe_dialog();
        });

        function show_alarm_subscribe_dialog() {
            populate_alarms_from_region(selected_region());
            var diagram = diagrams.shown();
            if (diagram) {
                if (diagram.network.getSelectedNodes().length > 0) {
                    subscribe_save_button(false);
                    populate_selected_items(diagram.network.getSelectedNodes());
                    $("#subscribe_to_alarms_modal").modal('show');
                } else {
                    alert.show("Select at least one node");
                }
            } else
            if (tile_view.shown()) {
                var tile_name = tile_view.selected();
                if (tile_name) {
                    channels.retrieve_channel(tile_name).then(function(members) {
                        var node_ids = _.map(members, "id");
                        populate_selected_items(node_ids);
                        $("#subscribe_to_alarms_modal").modal('show');
                    });
                } else {
                    alert.show("Select a tile");
                }
            }
        }

        $("#subscribe_to_alarms_save").on("click", function(event) {
            // var diagram = diagrams.shown();
            var node_ids = JSON.parse($("#subscribe_to_alarms_modal").attr("data-node-ids"));
            var promises = [];
            for (let alarm of selected_alarm_data) {
                promises.push(alarms.subscribe_to_alarm(selected_alarm_region, alarm.AlarmName, node_ids));
            }
            Promise.all(promises).then(function() {
                alert.show("Saved");
                $("#subscribe_to_alarms_modal").modal('hide');
                console.log("refresh monitor views");
                require("app/ui/monitor_view").refresh();
            }).catch(function(error) {
                alert.show("Error while saving");
            });
        });

        $("#subscribe_to_alarms_cancel").on("click", function(event) {
            console.log("subscribe_to_alarms_cancel");
            $("#subscribe_to_alarms_modal").modal('hide');
        });

        // configure alarm subscription dialog
        regions_promise().then(function(module) {
            $("#subscribe_to_alarms_region_dropdown").empty();
            for (let region of module.get_available()) {
                var id = `alarm_subscribe_region_${region.RegionName}`;
                var button_html = `<a class="dropdown-item" href="#" id="${id}">${region.RegionName}</button><br>`;
                $("#subscribe_to_alarms_region_dropdown").append(button_html);
                $("#" + id).on("click", (function() {
                    var local_name = region.RegionName;
                    return function(event) {
                        $("#dropdownMenuButton").text(local_name);
                        populate_alarms_from_region(local_name);
                    };
                })());
            }
            var first_region = "us-east-1";
            $("#dropdownMenuButton").text(first_region);
        });

        var selected_region = function() {
            return $("#dropdownMenuButton").text();
        };

        return {
            show_alarm_subscribe_dialog: show_alarm_subscribe_dialog
        }

    });