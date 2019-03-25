/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/ui/global_view", "app/events", "app/ui/tile_view", "app/ui/diagrams"],
    function($, _, model, global_view, event_alerts, tile_view, diagrams) {

        var last_displayed;

        var show = function() {
            $("#" + tab_id).tab('show');
        };

        var display_no_selection = function() {
            $("#nav-monitor-alerts-subtitle").empty();
            $("#nav-monitor-alerts-text").empty();
            $("#nav-monitor-alarms-subtitle").empty();
            $("#nav-monitor-alarms-text").empty();
        };

        var alert_tabulator = new Tabulator("#nav-monitor-alerts-text", {
            placeholder: "No Recent Pipeline Alerts",
            tooltips: true,
            selectable: false,
            height: 200,
            layout: "fitColumns",
            columns: [{
                title: "Event Source ARN",
                field: "channel_arn"
            }, {
                title: "Event Source Name",
                field: "name"
            }, {
                title: "Alert",
                field: "alert_type"
            }, {
                title: "Message",
                field: "message",
                widthGrow: 3
            }, {
                title: "Pipeline",
                field: "pipeline",
                widthGrow: 0
            }, {
                title: "Time",
                field: "time"
            }]
        });


        var alarm_tabulator = new Tabulator("#nav-monitor-alarms-text", {
            placeholder: "No Alarm Subscriptions",
            tooltips: true,
            selectable: false,
            height: 200,
            layout: "fitColumns",
            columns: [{
                title: "Subscriber ARN",
                field: "ARN"
            }, {
                title: "Subscriber Name",
                field: "name"
            }, {
                title: "Alarm Region",
                field: "Region"
            }, {
                title: "Alarm Namespace",
                field: "Namespace"
            }, {
                title: "Alarm Name",
                field: "AlarmName"
            }, {
                title: "Alarm State",
                field: "StateValue"
            }, {
                title: "Alarm State Updated",
                field: "StateUpdated"
            }]
        });

        var display_selected_nodes = function(diagram, node_ids) {
            nodes_ids = Array.isArray(node_ids) ? node_ids : [node_ids];
            var node = model.nodes.get(node_ids[0]);
            var data = [];
            $("#nav-monitor-selected-item").html(node.header);
            // event alerts
            event_alerts.get_cached_events().current.forEach(function(event_value) {
                if (event_value.resource_arn == node.id) {
                    event_value.detail.name = node.name;
                    data.push(event_value.detail);
                }
            });
            alert_tabulator.setData(data);
            // alarms
            require("app/alarms").alarms_for_subscriber(node.id).then(function(subscriptions) {
                for (subscription of subscriptions) {
                    if (subscription.StateUpdated) {
                        subscription.StateUpdated = new Date(subscription.StateUpdated * 1000).toISOString();
                    }
                    subscription.ARN = node.id;
                    subscription.name = node.name;
                }
                alarm_tabulator.setData(subscriptions);
            });
        };

        var display_selected_tile = function(name, members) {
            var alert_data = [];
            var alarm_data = [];
            var promises = [];
            $.each(members, function(member_index, member_value) {
                var node = model.nodes.get(member_value.id);
                $.each(event_alerts.get_cached_events().current, function(event_index, event_value) {
                    if (member_value.id == event_value.resource_arn) {
                        event_value.detail.name = node.name;
                        alert_data.push(event_value.detail);
                    }
                });
                promises.push(new Promise(function(resolve, reject) {
                    var local_node_id = member_value.id;
                    var local_node_name = node.name;
                    require("app/alarms").alarms_for_subscriber(local_node_id).then(function(subscriptions) {
                        for (subscription of subscriptions) {
                            subscription.StateUpdated = new Date(subscription.StateUpdated * 1000).toISOString();
                            subscription.ARN = local_node_id;
                            subscription.name = local_node_name;
                        }
                        alarm_data = alarm_data.concat(subscriptions);
                        resolve();
                    });
                }));
            });
            Promise.all(promises).then(function() {
                if (!alarm_tabulator_ready) {
                    create_alarm_tabulator();
                }
                if (!alert_tabulator_ready) {
                    create_alert_tabulator();
                }
                $("#nav-monitor-alarms-text").tabulator("setData", alarm_data);
                $("#nav-monitor-alerts-text").tabulator("setData", alert_data);
            });
        };

        var global_view_click_listener = function(event) {
            // console.log(event);
            if (event.nodes.length > 0) {
                last_displayed = event.nodes[0];
                display_selected_node(model.nodes.get(event.nodes[0]));
            }
        };

        var tile_view_click_listener = function(name, members) {
            if (tile_view.get_selected_tile_name() != "") {
                last_displayed = {
                    name: name,
                    members: members
                };
                display_selected_tile(name, members);
            } else {
                last_displayed = undefined;
                display_no_selection();
            }
        };

        var event_alert_listener = function() {
            if (last_displayed) {
                if (typeof last_displayed == 'string') {
                    display_selected_node(model.nodes.get(last_displayed));
                } else if (typeof last_displayed == 'object') {
                    display_selected_tile(last_displayed.name, last_displayed.members);
                }
            }
        };

        // global_view.add_click_listener(global_view_click_listener);
        // tile_view.add_click_listener(tile_view_click_listener);
        // event_alerts.add_listener(event_alert_listener);

        diagrams.add_selection_callback(function(diagram, event) {
            if (event.nodes.length > 0) {
                display_selected_nodes(diagram, event.nodes);
            }
        });

    });