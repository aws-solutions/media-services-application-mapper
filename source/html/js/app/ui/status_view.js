/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as statemachine from "../statemachine.js";

let current_tab = "";
let progressTimer;

let calculate_progress = function (fsm) {
    // get the total number of states for this FSM
    let states = Object.keys(fsm.states);
    // get our current position within the states
    let index = states.indexOf(fsm.state);
    // calculate the current state position as a percentage
    return Number.parseInt(((index + 1) / states.length) * 100);
};

let show = function () {
    if (typeof progressTimer === "undefined") {
        progressTimer = setTimeout(update, 500);
    }
};

let update = function () {
    let id = "#nav-status";
    let tab = id + "-tab";
    if (current_tab !== tab) {
        $(tab).tab("show");
    }
    let configuration_percent = calculate_progress(
        statemachine.getConfigurationStateMachine()
    );
    let model_data_percent = calculate_progress(
        statemachine.getModelDataStateMachine()
    );
    let configuration_class =
        configuration_percent < 100 ? "progress-bar-striped progress-bar-animated bg-warning" : "bg-success";
    let model_data_class =
        model_data_percent < 100 ? "progress-bar-striped progress-bar-animated bg-warning" : "bg-success";
    let configuration_stats =
        configuration_percent < 100 ? configuration_percent + "%" : "Ready";
    let model_stats = `${model.nodes.length} Nodes, ${model.edges.length} Connections`;
    let html = `
        <table class="table table-sm borderless">
            <tbody>
                <tr>
                    <th scope="row">Configuration</th>
                    <td nowrap>
                        <div class="progress" style="width: 35%;">
                            <div class="progress-bar ${configuration_class}" role="progressbar" style="width: ${configuration_percent}%;" aria-valuenow="${configuration_percent}%" aria-valuemin="0" aria-valuemax="100">${configuration_stats}</div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th scope="row" style="width: 10%;">Model Contents</th>
                    <td nowrap>
                        <div class="progress" style="width: 35%;">
                            <div class="progress-bar ${model_data_class}" role="progressbar" style="width: ${model_data_percent}%;" aria-valuenow="${model_data_percent}%" aria-valuemin="0" aria-valuemax="100">${model_stats}</div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>`;
    $(id).html(html);
    progressTimer = undefined;
};

model.nodes.on("add", function () {
    show();
});

model.edges.on("add", function () {
    show();
});

statemachine.getToolStateMachine().on("transition", function () {
    show();
});
