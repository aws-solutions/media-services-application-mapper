/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// this module bootstraps the state machine, which starts the application running
// wait for the signal from JQuery before loading and initializing

$(window.document).ready(async function () {
    // say hello
    console.log("main");
    try {
        // minimal modules required to start running
        const statemachine = await import("./statemachine.js");
        await import("./ui/status_view.js");
        // start the outer FSM at the beginning
        statemachine.getToolStateMachine().start();
    } catch (error) {
        console.error(error);
    }
});
