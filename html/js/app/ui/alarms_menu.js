/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/ui/global_view", "app/ui/util", "app/alarms", "app/regions", "app/ui/alert"],
    function($, _, model, global_view, ui_util, alarms, regions_promise, alert) {

        var regions_list;

        var alarm_tabulator_ready = false;
        var items_tabulator_ready = false;

        var selected_alarm_data;
        var selected_alarm_region;

        var populate_alarms_from_region = function(region) {
            selected_alarm_region = region;
            $("#subscribe_to_alarms_modal_alarm_selection_count").text("0");
            alarms.all_alarms_for_region(region).then(function(response) {
                if (!alarm_tabulator_ready) {
                    $("#subscribe_to_alarms_modal_alarm_selection").empty();
                    $("#subscribe_to_alarms_modal_alarm_selection").tabulator({
                        placeholder: "No Alarms Defined in this Region",
                        tooltips: true,
                        selectable: true, //make rows selectable
                        height: 400, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
                        layout: "fitColumns", //fit columns to width of table (optional)
                        columns: [ //Define Table Columns
                            {
                                title: "Namespace",
                                field: "Namespace",
                                headerFilter: true
                            }, {
                                title: "Alarm",
                                field: "AlarmName",
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
                            subscribe_save_button(global_view.get_selected().nodes.length > 0 && data.length > 0);
                        },
                    });
                    alarm_tabulator_ready = true;
                }
                $("#subscribe_to_alarms_modal_alarm_selection").tabulator("deselectRow"); //deselect all rows
                $("#subscribe_to_alarms_modal_alarm_selection").tabulator("setData", response);
            });
        };

        var populate_selected_items = function() {
            var data = model.nodes.get(global_view.get_selected().nodes);
            if (!items_tabulator_ready) {
                $("#subscribe_to_alarms_modal_selected_items").empty();
                $("#subscribe_to_alarms_modal_selected_items").tabulator({
                    placeholder: "No Model Items Selected",
                    tooltips: true,
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
                items_tabulator_ready = true;
            }
            $("#subscribe_to_alarms_modal_selected_items").tabulator("setData", data);
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

        $("#alarms_manage_subscriptions_button").on("click", function(event) {
            console.log("alarms_manage_subscriptions_button");
        });

        $("#alarms_subscribe_button").on("click", function(event) {
            subscribe_save_button(false);
            populate_selected_items();
            $("#subscribe_to_alarms_modal").modal('show');
        });

        $("#subscribe_to_alarms_save").on("click", function(event) {
            var node_ids = global_view.get_selected().nodes;
            var promises = [];
            $.each(selected_alarm_data, function(index, alarm) {
                promises.push(alarms.subscribe_to_alarm(selected_alarm_region, alarm.AlarmName, node_ids));
            });
            Promise.all(promises).then(function() {
                alert.show("Saved");
                $("#subscribe_to_alarms_modal").modal('hide');
            }).catch(function(error) {
                alert("Error while saving");
            });
        });

        $("#subscribe_to_alarms_cancel").on("click", function(event) {
            console.log("subscribe_to_alarms_cancel");
            $("#subscribe_to_alarms_modal").modal('hide');
        });

        // configure alarm subscription dialog
        regions_promise().then(function(module) {
            $("#subscribe_to_alarms_region_dropdown").empty();
            regions_list = module.get_available();
            $.each(regions_list, (index, region) => {
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
            });
            var first_region = "us-east-1";
            $("#dropdownMenuButton").text(first_region);
            populate_alarms_from_region(first_region);
        });

    });