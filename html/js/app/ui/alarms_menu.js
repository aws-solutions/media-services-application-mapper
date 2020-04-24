/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/alarms", "app/regions", "app/ui/alert", "app/ui/diagrams", "app/ui/tile_view", "app/channels"],
    function($, _, model, alarms, regions_promise, alert, diagrams, tile_view, channels) {

        var regions_list;

        var alarms_tabulator = new Tabulator("#subscribe_to_alarms_modal_alarm_selection", {
            placeholder: "No Alarms Defined in this Region",
            tooltips: true,
            height: 400, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
            layout: "fitColumns", //fit columns to width of table (optional)
            selectable: true,
            selectableRangeMode: "click",
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

        var populate_alarms_from_region = function(region) {
            selected_alarm_region = region;
            $("#subscribe_to_alarms_modal_alarm_selection_count").text("0");
            alarms.all_alarms_for_region(region).then(function(response) {
                // $("#subscribe_to_alarms_modal_alarm_selection").tabulator("deselectRow"); //deselect all rows
                // $("#subscribe_to_alarms_modal_alarm_selection").tabulator("setData", response);
                alarms_tabulator.setData(response);
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

        $("#alarms_manage_subscriptions_button").on("click", function(event) {
            console.log("alarms_manage_subscriptions_button");
        });

        $("#alarms_subscribe_button").on("click", function(event) {
            show_alarm_subscribe_dialog();
        });

        function show_alarm_subscribe_dialog() {
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
            for (let region of regions_list) {
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
            populate_alarms_from_region(first_region);
        });

        return {
            show_alarm_subscribe_dialog: show_alarm_subscribe_dialog
        }

    });