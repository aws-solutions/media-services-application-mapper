/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["app/connections", "app/regions", "app/model", "app/ui/settings_menu", "lodash", "machina", "app/ui/global_view", "app/plugins", "app/api_check", "app/ui/confirmation"],
    function(connections, regions_promise, model, settings_menu, _, machina, global_view, plugins, api_check, confirmation) {

        // This FSM tracks the state of configuration loading at tool startup
        var configurationStateMachine = new machina.Fsm({
            namespace: "configuration",
            initialState: "uninitialized",
            states: {
                uninitialized: {
                    "*": function() {
                        this.deferUntilTransition();
                        this.transition("get-saved-connection");
                    }
                },
                "get-saved-connection": {
                    _onEnter: function() {
                        var current_connection = connections.get_current();
                        if (null === current_connection) {
                            console.log("no connection history");
                            this.noSavedConnection();
                        } else {
                            console.log("testing last connection used");
                            // test current connection with api-ping
                            var endpoint = current_connection[0];
                            var api_key = current_connection[1];
                            var instance = this;
                            api_check.ping(endpoint, api_key).then(function(response) {
                                // test worked
                                console.log("still working");
                                console.log(response);
                                instance.connectionExists();
                            }).catch(function(error) {
                                console.log("not working");
                                instance.noSavedConnection();
                            });
                        }
                    },
                    "noSavedConnection": "get-connection-from-ui",
                    "connectionExists": "get-saved-regions"
                },
                "get-connection-from-ui": {
                    _onEnter: function() {
                        console.log("prompting for connection");
                        settings_menu.setConnectionAlert("One working endpoint connection is required");
                        settings_menu.showConnectionDialog();
                    },
                    _onExit: function() {
                        settings_menu.clearConnectionAlert();
                    },
                    "connectionChanged": "get-saved-regions",
                },
                "get-saved-regions": {
                    _onEnter: function() {
                        var instance = this;
                        regions_promise().then(function(regions) {
                            if (regions.get_selected().length > 0) {
                                console.log("using saved region selectons");
                                instance.regionsExist();
                            } else {
                                console.log("no previously selected regions");
                                instance.noSavedRegions();
                            }
                        }).catch(function(error) {
                            console.log(error);
                        });
                    },
                    "noSavedRegions": "get-regions-from-ui",
                    "regionsExist": "configuration-ready",
                },
                "get-regions-from-ui": {
                    _onEnter: function() {
                        // update and show the region selection dialog
                        settings_menu.showRegionSelectionDialog();
                    },
                    "regionsChanged": "configuration-ready",
                },
                "configuration-ready": {
                    _onEnter: function() {
                        this.handle("configurationReady");
                    }
                }
            },
            connectionChanged: function() {
                this.handle("connectionChanged");
            },
            connectionExists: function() {
                this.handle("connectionExists");
            },
            noSavedConnection: function() {
                this.handle("noSavedConnection");
            },
            noSavedRegions: function() {
                this.handle("noSavedRegions");
            },
            regionsRetrieved: function() {
                this.handle("regionsRetrieved");
            },
            regionsChanged: function() {
                this.handle("regionsChanged");
            },
            regionsExist: function() {
                this.handle("regionsExist");
            },
            start: function() {
                this.handle("start");
            }
        });

        // This FSM tracks the state of model data initial loading
        var modelDataStateMachine = new machina.Fsm({
            namespace: "model",
            initialState: "uninitialized",
            states: {
                uninitialized: {
                    "*": function() {
                        this.deferUntilTransition();
                        this.transition("get-saved-channels");
                    }
                },
                "get-saved-channels": {
                    // pull in settings from Dynamo, later
                    _onEnter: function() {
                        this.transition("get-saved-layouts");
                    }
                },
                "get-saved-layouts": {
                    // pull in settings from Dynamo, later
                    _onEnter: function() {
                        this.transition("get-associated-alarms");
                    }
                },
                "get-associated-alarms": {
                    // pull in settings from Dynamo, later
                    _onEnter: function() {
                        this.transition("get-model-data");
                    }
                },
                "get-model-data": {
                    _onEnter: function() {
                        var ref = this;
                        // load the overlays
                        require(plugins.overlays, function() {
                            // create a closed callback
                            var f = (function() {
                                return function() {
                                    ref.handle("modelDataReady");
                                };
                            })();
                            // tell the model module to map the services
                            model.map(f);
                        });
                    },
                    modelDataReady: "model-data-ready"
                },
                "model-data-ready": {
                    // done
                    _onEnter: function() {
                        this.handle("modelDataReady");
                    },
                    refreshModelData: "get-saved-channels"
                }
            },
            "start": function() {
                this.handle("start");
            },
            "modelDataReady": function() {
                this.handle("modelDataReady");
            }
        });

        var toolStateMachine = new machina.Fsm({
            namespace: "tool",
            initialState: "uninitialized",
            states: {
                uninitialized: {
                    "*": function() {
                        this.deferUntilTransition();
                        this.transition("disable-ui");
                    }
                },
                "disable-ui": {
                    _onEnter: function() {
                        this.transition("get-configuration");
                    }
                },
                "get-configuration": {
                    _child: configurationStateMachine,
                    configurationReady: "enable-ui"
                },
                "enable-ui": {
                    _onEnter: function() {
                        this.transition("get-model-data");
                    }
                },
                "get-model-data": {
                    _child: modelDataStateMachine,
                    modelDataReady: "update-visual-model"
                },
                "update-visual-model": {
                    _onEnter: function() {
                        // update global view
                        // global_view.init();
                        // global_view.show();
                        this.handle("visualModelReady")
                    },
                    "visualModelReady": "visual-model-fresh"
                        // update tile view, select first tile
                        // update channel view (this happens with tile selection)

                },
                "visual-model-fresh": {
                    _onEnter: function() {
                        // initialize the next set of UI modules that depend on the model and global view
                        require([
                            "app/ui/alarms_menu",
                            "app/ui/alarm_indicators",
                            "app/ui/channels_menu",
                            "app/ui/diagram_menu",
                            "app/ui/dragdrop",
                            "app/ui/event_alert_indicators",
                            "app/ui/informational_overlays",
                            "app/ui/monitor_view",
                            "app/ui/nodes_menu",
                            "app/ui/search_view",
                            "app/ui/selected_item_view",
                            "app/ui/tile_view",
                            "app/ui/tools_menu"
                        ]);
                        // show the tiles tab
                        $("#channel-tiles-tab").tab('show');
                    },
                    // start a timer and/or events to watch model data
                    refreshModelData: function() {
                        // model.reset();
                        // hold the input until after transitioning to the next state
                        this.deferUntilTransition();
                        this.transition("get-model-data");
                    },
                    "connectionChanged": function() {
                        // prompt for reload
                        confirmation.show("<p>Would you like to reload from the new endpoint?</p>", function() {
                            window.location.reload();
                        });
                    },
                    "regionsChanged": function() {
                        // prompt for reload
                        confirmation.show("<p>Would you like to reload for the changed regions?</p>", function() {
                            window.location.reload();
                        });
                    }
                },
                "visual-model-stale": {
                    // transitions here when model needs to update storage or reverse
                }
            },
            "start": function() {
                this.handle("start");
            },
            "refreshModelData": function() {
                this.handle("refreshModelData");
            },
            "visualModelReady": function() {
                this.handle("visualModelReady");
            },
            connectionChanged: function() {
                this.handle("connectionChanged");
            },
            connectionExists: function() {
                this.handle("connectionExists");
            },
            noSavedConnection: function() {
                this.handle("noSavedConnection");
            },
            regionsChanged: function() {
                this.handle("regionsChanged");
            },
            regionsExist: function() {
                this.handle("regionsExist");
            }
        });

        // development logging
        toolStateMachine.on("transition", function(data) {
            // log the state transitions of the FSMs
            console.log(data);
        });

        return {
            "getConfigurationStateMachine": function() {
                return configurationStateMachine;
            },
            "getModelDataStateMachine": function() {
                return modelDataStateMachine;
            },
            "getToolStateMachine": function() {
                return toolStateMachine;
            }
        }
    });