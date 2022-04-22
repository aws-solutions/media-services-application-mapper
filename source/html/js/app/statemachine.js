/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as connections from "./connections.js";
import * as model from "./model.js";
import * as settings_menu from "./ui/settings_menu.js";
import * as api_check from "./api_check.js";
import * as confirmation from "./ui/confirmation.js";

// This FSM tracks the state of configuration loading at tool startup
const configurationStateMachine = new machina.Fsm({
    namespace: "configuration",
    initialState: "uninitialized",
    states: {
        uninitialized: {
            "*": function () {
                this.deferUntilTransition();
                this.transition("get-saved-connection");
            },
        },
        "get-saved-connection": {
            _onEnter: function () {
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
                    api_check
                        .ping(endpoint, api_key)
                        .then(function (response) {
                            // test worked
                            console.log("still working");
                            console.log(response);
                            instance.connectionExists();
                        })
                        .catch(function (error) {
                            console.error("not working");
                            console.error(error);
                            instance.noSavedConnection();
                        });
                }
            },
            noSavedConnection: "get-connection-from-ui",
            connectionExists: "configuration-ready",
        },
        "get-connection-from-ui": {
            _onEnter: function () {
                console.log("prompting for connection");
                settings_menu.setConnectionAlert(
                    "One working endpoint connection is required"
                );
                settings_menu.showConnectionDialog();
            },
            _onExit: function () {
                settings_menu.clearConnectionAlert();
            },
            connectionChanged: "configuration-ready",
        },
        "configuration-ready": {
            _onEnter: function () {
                // this will notify the parent state machine
                this.handle("configurationReady");
            },
        },
    },
    connectionChanged: function () {
        this.handle("connectionChanged");
    },
    connectionExists: function () {
        this.handle("connectionExists");
    },
    noSavedConnection: function () {
        this.handle("noSavedConnection");
    },
    noSavedRegions: function () {
        this.handle("noSavedRegions");
    },
    regionsRetrieved: function () {
        this.handle("regionsRetrieved");
    },
    regionsChanged: function () {
        this.handle("regionsChanged");
    },
    regionsExist: function () {
        this.handle("regionsExist");
    },
    start: function () {
        this.handle("start");
    },
});

// This FSM tracks the state of model data initial loading
const modelDataStateMachine = new machina.Fsm({
    namespace: "model",
    initialState: "uninitialized",
    states: {
        uninitialized: {
            "*": function () {
                this.deferUntilTransition();
                this.transition("get-saved-channels");
            },
        },
        "get-saved-channels": {
            // pull in settings from Dynamo, later
            _onEnter: function () {
                this.transition("get-saved-layouts");
            },
        },
        "get-saved-layouts": {
            // pull in settings from Dynamo, later
            _onEnter: function () {
                this.transition("get-associated-alarms");
            },
        },
        "get-associated-alarms": {
            // pull in settings from Dynamo, later
            _onEnter: function () {
                this.transition("get-model-data");
            },
        },
        "get-model-data": {
            _onEnter: async function () {
                var ref = this;
                // create a closed callback
                var f = (function () {
                    return function () {
                        ref.handle("modelDataReady");
                    };
                })();
                // tell the model module to map the services
                model.map(f);
            },
            modelDataReady: "model-data-ready",
        },
        "model-data-ready": {
            // done
            _onEnter: function () {
                this.handle("modelDataReady");
            },
            refreshModelData: "get-saved-channels",
        },
    },
    start: function () {
        this.handle("start");
    },
    modelDataReady: function () {
        this.handle("modelDataReady");
    },
});

const toolStateMachine = new machina.Fsm({
    namespace: "tool",
    initialState: "uninitialized",
    states: {
        uninitialized: {
            "*": function () {
                this.deferUntilTransition();
                this.transition("disable-ui");
            },
        },
        "disable-ui": {
            _onEnter: function () {
                this.transition("get-configuration");
            },
        },
        "get-configuration": {
            _child: configurationStateMachine,
            configurationReady: "enable-ui",
        },
        "enable-ui": {
            _onEnter: function () {
                this.transition("get-model-data");
            },
        },
        "get-model-data": {
            _child: modelDataStateMachine,
            modelDataReady: "update-visual-model",
        },
        "update-visual-model": {
            _onEnter: function () {
                this.handle("visualModelReady");
            },
            visualModelReady: "visual-model-fresh",
            // update tile view, select first tile
            // update channel view (this happens with tile selection)
        },
        "visual-model-fresh": {
            _onEnter: async function () {
                // initialize the next set of UI modules that depend on the model and global view
                await import("./ui/svg_node.js");
                await import("./ui/alarms_menu.js");
                await import("./ui/alarm_indicators.js");
                await import("./ui/channels_menu.js");
                await import("./ui/diagram_menu.js");
                await import("./ui/dragdrop.js");
                await import("./ui/event_alert_indicators.js");
                await import("./ui/informational_overlays.js");
                await import("./ui/monitor_view.js");
                await import("./ui/nodes_menu.js");
                await import("./ui/notes_view.js");
                await import("./ui/search_view.js");
                await import("./ui/selected_item_view.js");
                await import("./ui/tile_view.js");
                await import("./ui/information_compartment.js");
                await import("./ui/user_defined.js");
                await import("./ui/help_menu.js");
                // initialize modules with intervals
                const alarms = await import("./alarms.js");
                alarms.deferred_init();
                const events = await import("./events.js");
                events.deferred_init();
                await import("./ui/notes_menu.js")
                // show the tiles tab
                $("#channel-tiles-tab").tab("show");
            },
            // start a timer and/or events to watch model data
            refreshModelData: function () {
                // model.reset();
                // hold the input until after transitioning to the next state
                this.deferUntilTransition();
                this.transition("get-model-data");
            },
            connectionChanged: function () {
                // prompt for reload
                confirmation.show(
                    "<p>Would you like to reload from the new endpoint?</p>",
                    function () {
                        window.location.reload();
                    }
                );
            },
            regionsChanged: function () {
                // prompt for reload
                confirmation.show(
                    "<p>Would you like to reload for the changed regions?</p>",
                    function () {
                        window.location.reload();
                    }
                );
            },
        },
        "visual-model-stale": {
            // transitions here when model needs to update storage or reverse
        },
    },
    start: function () {
        this.handle("start");
    },
    refreshModelData: function () {
        this.handle("refreshModelData");
    },
    visualModelReady: function () {
        this.handle("visualModelReady");
    },
    connectionChanged: function () {
        this.handle("connectionChanged");
    },
    connectionExists: function () {
        this.handle("connectionExists");
    },
    noSavedConnection: function () {
        this.handle("noSavedConnection");
    },
    regionsChanged: function () {
        this.handle("regionsChanged");
    },
    regionsExist: function () {
        this.handle("regionsExist");
    },
});

toolStateMachine.on("transition", function (data) {
    // log the state transitions of the FSMs
    console.log(data);
});

export function getConfigurationStateMachine() {
    return configurationStateMachine;
}

export function getModelDataStateMachine() {
    return modelDataStateMachine;
}

export function getToolStateMachine() {
    return toolStateMachine;
}
