/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as settings from "../settings.js";
import * as diagram_factory from "./diagram_factory.js";
import * as nav_alert from "./alert.js";

var diagrams = {};

var selection_callbacks = [];

var shown_diagram = function () {
    var shown = null;
    for (let d of Object.values(diagrams)) {
        if (d.shown()) {
            shown = d;
            break;
        }
    }
    return shown;
};

var get_all = function () {
    return diagrams;
};

var add_selection_callback = function (callback) {
    if (!selection_callbacks.includes(callback)) {
        selection_callbacks.push(callback);
    }
};

var add_diagram = function (name, view_id, save) {
    var diagram = diagram_factory.create(name, view_id);
    diagrams[name] = diagram;
    if (save) {
        save_diagrams();
    }
    diagram.add_singleclick_callback(function (diagram, event) {
        for (let callback of selection_callbacks) {
            try {
                callback(diagram, event);
            } catch (error) {
                console.log(error);
            }
        }
    });
    return diagram;
};

var remove_diagram = function (name) {
    const view_id = diagrams[name].view_id;
    // remove page elements
    diagrams[name].remove();
    // remove object
    delete diagrams[name];
    // update settings
    save_diagrams();
    // remove the lock settings
    const key = `diagram_lock_${view_id}`;
    settings.remove(key);
    // select the tile tab
    $("#channel-tiles-tab").tab("show");
};

var get_by_name = function (name) {
    return diagrams[name];
};

var save_diagrams = function () {
    var diagram_map = _.map(Object.values(diagrams), function (item) {
        return {
            name: item.name,
            view_id: item.view_id,
        };
    });
    settings
        .put("diagrams", diagram_map)
        .then(function () {
            console.log("diagrams saved");
        })
        .catch(function (error) {
            console.error(error);
        });
};

var load_diagrams = function () {
    return new Promise((resolve) => {
        // load diagram names from the cloud on initialization
        settings.get("diagrams").then(function (diagrams) {
            console.log(
                "load user-defined diagrams: " + JSON.stringify(diagrams)
            );
            if (Array.isArray(diagrams) && diagrams.length > 0) {
                for (let diagram of diagrams) {
                    add_diagram(diagram.name, diagram.view_id, false);
                }
            } else {
                // no diagrams, create default View from previous Global View
                console.log(
                    "no used-defined diagrams, creating default diagram"
                );
                add_diagram("Default", "global", true);
            }
            resolve();
        });
    });
};

function have_all(node_ids) {
    var results = [];
    if (!Array.isArray(node_ids)) {
        node_ids = [node_ids];
    }
    for (let name in diagrams) {
        var diagram = diagrams[name];
        var found = _.compact(diagram.nodes.get(node_ids));
        if (found.length === node_ids.length) {
            results.push(diagram);
        }
    }
    return _.orderBy(results, ["name"]);
}

function have_any(node_ids) {
    var results = [];
    node_ids = node_ids || [];
    if (!Array.isArray(node_ids)) {
        node_ids = [node_ids];
    }
    node_ids = node_ids.sort();
    for (let diagram of Object.values(diagrams)) {
        var intersect = _.intersection(diagram.nodes.getIds().sort(), node_ids);
        if (intersect.length > 0) {
            results.push({
                diagram: diagram.name,
                found: intersect,
            });
        }
    }
    return _.orderBy(results, ["diagram"]);
}

const update_lock_visibility = () => {
    // are we showing a diagram or tiles?
    if (shown_diagram()) {
        // show the lock
        $("#diagram-lock-button").removeClass("d-none");
    } else {
        // hide the lock
        $("#diagram-lock-button").addClass("d-none");
    }
};

const update_lock_state = () => {
    const menu_ids = [
        "diagram_manage_contents",
        "diagram_add_downstream",
        "diagram_add_upstream",
        "diagram_add_all_nodes",
        "nodes_align_vertical",
        "nodes_align_horizontal",
        "nodes_layout_vertical",
        "nodes_layout_horizontal",
        "nodes_layout_isolated",
        "diagram_remove_selected",
        "diagram_remove_diagram",
    ];
    // only update if we're showing a diagram
    let diagram = shown_diagram();
    if (diagram) {
        // get the lock state from settings
        diagram.isLocked().then((locked) => {
            console.log(
                `diagram ${diagram.name} is ${locked ? "locked" : "unlocked"}`
            );
            // update the lock icon
            const html = locked ? "lock" : "lock_open";
            $("#diagram-lock-icon").html(html);
            // change the state of the vis.js network to match the lock
            const options = {
                interaction: {
                    dragNodes: !locked,
                },
            };
            diagram.network.setOptions(options);
            // update menu items for diagrams
            for (let id of menu_ids) {
                if (locked) {
                    $(`#${id}`).addClass("disabled");
                } else {
                    $(`#${id}`).removeClass("disabled");
                }
            }
        });
    }
};

const create_lock_compartment = () => {
    // do this relative to the diagram div
    const diagramDiv = $("#diagram");
    // get the location and size of the diagram div
    const diagramPosition = diagramDiv.position();
    const width = diagramDiv.width();
    // create
    const h_offset = 30;
    const v_offset = 2;
    const style = `position: absolute; top: ${
        diagramPosition.top + v_offset
    }px; left: ${width - h_offset}px; z-index: 500; cursor: pointer;`;
    const buttonDiv = `<div id="diagram-lock-button" style="${style}"><span title="Lock/Unlock Changes" id="diagram-lock-icon" class="material-icons">lock_open</span></div>`;
    diagramDiv.before(buttonDiv);
    $("#diagram-lock-button").click(() => {
        const diagram = shown_diagram();
        diagram.isLocked().then((locked) => {
            // reverse it
            locked = !locked;
            diagram.lock(locked).then(() => {
                update_lock_state();
                const message = locked ? "Diagram locked" : "Diagram unlocked";
                nav_alert.show(message);
            });
        });
    });
    update_lock_visibility();
};

// this is the initialization code for the diagrams component
load_diagrams().then(() => {
    create_lock_compartment();
    $("#diagram-tab").on("shown.bs.tab", () => {
        update_lock_visibility();
        update_lock_state();
    });
    var current_url = new URL(window.location);
    var override_diagram = current_url.searchParams.get("diagram");
    if (override_diagram) {
        console.log("Show diagram " + override_diagram + " on start");
        var diagram = get_by_name(override_diagram);
        diagram.show();
    }
});

export {
    shown_diagram as shown,
    get_all,
    add_diagram as add,
    remove_diagram as remove,
    get_by_name,
    have_all,
    have_any,
    add_selection_callback,
};
