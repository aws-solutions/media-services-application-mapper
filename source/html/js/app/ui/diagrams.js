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
    let diagrams_shown = parseInt(window.localStorage.getItem("DIAGRAMS_SHOWN"));
    const new_diagram = diagram_factory.create(name, view_id);
    diagrams[name] = new_diagram;
    if (save) {
        save_diagrams();
    }
    new_diagram.add_singleclick_callback(function (diagram, event) {
        for (let callback of selection_callbacks) {
            try {
                callback(diagram, event);
            } catch (error) {
                console.log(error);
            }
        }
    });
    window.localStorage.setItem(name, Date.now());
    window.localStorage.setItem("DIAGRAMS_SHOWN", diagrams_shown+=1);
    settings.get("max-number-displayed-diagrams").then(function (max_number_diagrams) {
        if (diagrams_shown > max_number_diagrams) {
            console.log("exceeded number of diagrams to show");
            let diagram_to_hide = oldest_viewed_diagram();
            hide_diagram(diagram_to_hide.name, false);
            window.localStorage.setItem("DIAGRAMS_SHOWN", diagrams_shown - 1);
        }
    });
    return new_diagram;
};

var show_diagram = function (name, view_id) {
    const new_diagram = diagram_factory.create(name, view_id);
    diagrams[name] = new_diagram;
    new_diagram.add_singleclick_callback(function (diagram, event) {
        for (let callback of selection_callbacks) {
            try {
                callback(diagram, event);
            } catch (error) {
                console.log(error);
            }
        }
    });
    return new_diagram;
};

var hide_diagram = function (name, show_tile = true) {
    console.log(`hiding ${name}`);
    const view_id = diagrams[name].view_id;
    // remove page elements
    diagrams[name].remove();
    // remove the lock settings
    const key = `diagram_lock_${view_id}`;
    settings.remove(key);
    if (show_tile){
        $("#channel-tiles-tab").tab("show");
    }
    let diagrams_shown = parseInt(window.localStorage.getItem("DIAGRAMS_SHOWN"));
    window.localStorage.setItem("DIAGRAMS_SHOWN", diagrams_shown-1);
    window.localStorage.removeItem(name);
    window.localStorage.setItem(name, 'HIDDEN');  
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
    // remove from local storage
    window.localStorage.removeItem(name);
    // decrement number of diagrams shown
    let diagrams_shown = parseInt(window.localStorage.getItem("DIAGRAMS_SHOWN"));
    window.localStorage.setItem("DIAGRAMS_SHOWN", diagrams_shown-1);
    window.localStorage.removeItem(name);
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
        let diagrams_shown = localStorage.getItem('DIAGRAMS_SHOWN');
        if (!diagrams_shown) {  // first load of the app, and no diagrams are being tracked yet
            localStorage.setItem('DIAGRAMS_SHOWN', 0);
            // load diagram names from the cloud on initialization
            settings.get("diagrams").then(function (all_diagrams) {
                settings.get("max-number-displayed-diagrams").then(function (max_number_diagrams) {
                    var diagrams_to_show = Math.min(max_number_diagrams, all_diagrams.length);
                    console.log(
                        "load user-defined diagrams: " + JSON.stringify(all_diagrams)
                    );
                    if (Array.isArray(all_diagrams) && all_diagrams.length > 0) {
                            for (let i=0; i < diagrams_to_show; i++) {
                                console.log(`loading ${all_diagrams[i].name}`);
                                add_diagram(all_diagrams[i].name, all_diagrams[i].view_id, false);
                            }
                            for (let i=diagrams_to_show; i < all_diagrams.length; i++) {
                                localStorage.setItem(all_diagrams[i].name, 'HIDDEN');
                            }
                    } else {
                        // no diagrams, create default View from previous Global View
                        console.log(
                            "no used-defined diagrams, creating default diagram"
                        );
                        add_diagram("Default", "global", true);
                    } 
                });
            }); 
        }
        else {
            // if there's already diagrams shown saved in local storage, 
            // show those instead of the first MAX_NUM_DIAGRAMS
            console.log('restoring diagrams');
            restore_diagrams();
        }        
        resolve();
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

function have_any(node_ids, match_sort = false) {
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
                percent: ((intersect.length / node_ids.length) * 100).toFixed(0)
            });
        }
    }
    if (match_sort) {
        return _.orderBy(results, [function (item) { return `${item.percent}`.padStart(3, '0'); }, "diagram"], ['desc', 'asc']);
    }
    else {
        return _.orderBy(results, ["diagram", function (item) { return `${item.percent}`.padStart(3, '0'); }], ['asc', 'desc']);
    }
}

function get_displayed_diagrams() {
    let displayed_diagrams = []
    for (let [key,value] of Object.entries(localStorage)) {
        if (key != "DIAGRAMS_SHOWN" && value != "HIDDEN"){
            displayed_diagrams.push(key);
        }
    }
    return displayed_diagrams;
}

async function restore_diagrams() {
    const local_lodash = _;
    let displayed_diagrams = get_displayed_diagrams();
    let all_diagrams = await settings.get("diagrams");
    for (let name of displayed_diagrams) {
        let diagram = local_lodash.find(all_diagrams, { 'name': name });
        show_diagram(name, diagram.view_id);
    }
}

function oldest_viewed_diagram (){
    let displayed_diagrams = [];
    const local_lodash = _;
    for (let [key, value] of Object.entries(localStorage)) {
        if (key != "DIAGRAMS_SHOWN"){
            displayed_diagrams.push({"name": key, "time": value});
        }
    }
    let sorted_diagrams = local_lodash.sortBy(displayed_diagrams, ['time']);
    return (sorted_diagrams.shift());
}

const update_lock_visibility = () => {
    // are we showing a diagram or tiles?
    let diagram = shown_diagram();
    if (diagram) {
        // show the lock
        window.localStorage.setItem(diagram.name, Date.now());
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
        // update the date of the diagram
        window.localStorage.setItem(diagram.name, Date.now());
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

const refresh_lock_compartment = () => {
    // do this relative to the diagram div
    const diagramDiv = $("#diagram");
    const buttonDiv = $("#diagram-lock-button");
    // get the location and size of the diagram div
    const diagramPosition = diagramDiv.position();
    const width = diagramDiv.width();
    // create
    const h_offset = 30;
    const v_offset = 2;
    const style = `position: absolute; top: ${diagramPosition.top + v_offset
        }px; left: ${width - h_offset}px; z-index: 500; cursor: pointer;`;
    const buttonContent = `<div id="diagram-lock-button" style="${style}"><span title="Lock/Unlock Changes" id="diagram-lock-icon" class="material-icons">lock_open</span></div>`;
    buttonDiv.replaceWith(buttonContent);
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

// detect window resize events
window.addEventListener('resize', function () {
    // reposition absolute diagram elements if needed
    refresh_lock_compartment();
    update_lock_state();
});

// this is the initialization code for the diagrams component
load_diagrams().then(() => {
    refresh_lock_compartment();
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
    hide_diagram as hide,
};
