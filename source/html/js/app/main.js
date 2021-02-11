/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// this module bootstraps the state machine, which starts the application running

define(["jquery", "app/window"], function($, window) {
    // wait for the signal before loading and initializing
    $(window.document).ready(function() {
        // minimal modules required to start running
        require(["app/statemachine", "app/ui/status_view"], function(statemachine) {
            // say hello
            console.log("main");
            // start the outer FSM at the beginning
            statemachine.getToolStateMachine().start();
        });
    });
});