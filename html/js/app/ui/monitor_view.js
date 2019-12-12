/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/events", "app/ui/tile_view", "app/ui/diagrams", "app/alarms", "app/ui/confirmation"],
    function($, _, model, event_alerts, tile_view, diagrams, alarms, confirmation) {

        var last_displayed;

        var alert_tabulator = new Tabulator("#nav-monitor-alerts-text", {
            placeholder: "No Recent Pipeline Alerts",
            tooltips: true,
            selectable: false,
            height: 250,
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
            selectable: true,
            selectableRangeMode: "click",
            selectablePersistence: true,
            height: 250,
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
            }, {
                tooltip: "Unsubscribe from Alarm",
                headerSort: false,
                formatter: "buttonCross",
                width: 40,
                align: "center",
                cellClick: function(e, cell) {
                    unsubscribe_alarm(cell.getRow()._row.data);
                }
            }]
        });

        var display_selected_node = function(node_id) {
            var node = model.nodes.get(node_id);
            last_displayed = node_id;
            var data = [];
            $("#nav-monitor-selected-item").html(node.header);
            // event alerts
            for (var event_value of event_alerts.get_cached_events().current) {
                if (event_value.resource_arn == node.id) {
                    event_value.detail.name = node.name;
                    data.push(event_value.detail);
                }
            }
            alert_tabulator.replaceData(data);
            // alarms
            require("app/alarms").alarms_for_subscriber(node.id).then(function(subscriptions) {
                // console.log(subscriptions);
                for (subscription of subscriptions) {
                    if (subscription.StateUpdated) {
                        subscription.StateUpdated = new Date(subscription.StateUpdated * 1000).toISOString();
                    }
                    subscription.ARN = node.id;
                    subscription.name = node.name;
                    subscription.id = node.id + ":" + subscription.Region + ":" + subscription.name;
                }
                alarm_tabulator.replaceData(subscriptions);
            });
        };

        var display_selected_tile = function(name, members) {
            var alert_data = [];
            var alarm_data = [];
            var promises = [];
            for (var member_value of members) {
                var node = model.nodes.get(member_value.id);
                if (node) {
                    for (var event_value of event_alerts.get_cached_events().current) {
                        if (member_value.id == event_value.resource_arn) {
                            event_value.detail.name = node.name;
                            alert_data.push(event_value.detail);
                        }
                    }
                    promises.push(new Promise(function(resolve, reject) {
                        var local_node_id = member_value.id;
                        var local_node_name = node.name;
                        require("app/alarms").alarms_for_subscriber(local_node_id).then(function(subscriptions) {
                            // console.log(subscriptions);
                            for (subscription of subscriptions) {
                                if (Number.isInteger(subscription.StateUpdated)) {
                                    subscription.StateUpdated = new Date(subscription.StateUpdated * 1000).toISOString();
                                }
                                subscription.ARN = local_node_id;
                                subscription.name = local_node_name;
                            }
                            alarm_data = alarm_data.concat(subscriptions);
                            resolve();
                        });
                    }));
                }
            }
            Promise.all(promises).then(function() {
                alarm_tabulator.replaceData(alarm_data);
                alert_tabulator.replaceData(alert_data);
                alarm_tabulator.redraw();
                alert_tabulator.redraw();
            });
        };

        var diagram_selection_listener = function(diagram, event) {
            if (event.nodes.length > 0) {
                last_displayed = event.nodes[0];
                display_selected_node(event.nodes[0]);
            }
        };

        var tile_view_click_listener = function(name, members) {
            if (tile_view.selected()) {
                last_displayed = {
                    name: name,
                    members: members
                };
                display_selected_tile(name, members);
            }
        };

        var event_alert_listener = function() {
            refresh();
        };

        tile_view.add_selection_callback(tile_view_click_listener);

        event_alerts.add_callback(event_alert_listener);

        alarms.add_callback(event_alert_listener);

        diagrams.add_selection_callback(function(diagram, event) {
            if (event.nodes.length > 0) {
                display_selected_node(event.nodes[0]);
            }
        });

        $("#monitor-subscribe-alarms-button").click(function() {
            require("app/ui/alarms_menu").show_alarm_subscribe_dialog();
        });

        $("#monitor-unsubscribe-alarms-button").click(function() {
            var selected_alarms = alarm_tabulator.getSelectedData();
            var diagram = diagrams.shown();
            var selected_nodes = diagram.network.getSelectedNodes();
            // console.log(selected_alarms);
            confirmation.show("Unsubscribe selected node" +
                (selected_nodes.length == 1 ? "" : "s") + " from " +
                selected_alarms.length + " alarm" +
                (selected_alarms.length == 1 ? "" : "s") + "?",
                function() {
                    var promises = [];
                    for (var alarm of selected_alarms) {
                        promises.push(alarms.unsubscribe_from_alarm(alarm.Region, alarm.AlarmName, selected_nodes));
                    }
                    Promise.all(promises).then(function() {
                        refresh();
                    });
                });
        });


        function unsubscribe_alarm(row) {
            console.log(row);
            var node = model.nodes.get(row.ARN);
            if (node) {
                // prompt if the node still exists
                confirmation.show("Unsubscribe " + node.header + " from alarm " + row.AlarmName + "?",
                    function() {
                        alarms.unsubscribe_from_alarm(row.Region, row.AlarmName, [row.ARN]).then(function() {
                            refresh();
                        });
                    });
            } else {
                // otherwise just delete it
                alarms.unsubscribe_from_alarm(row.Region, row.AlarmName, [row.ARN]).then(function() {
                    refresh();
                });
            }
        };



        function refresh() {
            if (typeof last_displayed == 'string') {
                display_selected_node(last_displayed);
            } else if (typeof last_displayed == 'object') {
                display_selected_tile(last_displayed.name, last_displayed.members);
            }
        }

        return {
            refresh: refresh
        }

    });