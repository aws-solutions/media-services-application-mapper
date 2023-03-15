/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as settings from "../settings.js";
import * as diagram_factory from "./diagram_factory.js";
import * as alert from "./alert.js";

let diagrams = {};

let selection_callbacks = [];

let shown_diagram = function () {
    let shown = null;
    for (let d of Object.values(diagrams)) {
        if (d.shown()) {
            shown = d;
            break;
        }
    }
    return shown;
};

let get_all = function () {
    return diagrams;
};

let add_selection_callback = function (callback) {
    if (!selection_callbacks.includes(callback)) {
        selection_callbacks.push(callback);
    }
};

let add_diagram = function (name, view_id, save) {
    let diagrams_shown = parseInt(window.localStorage.getItem("DIAGRAMS_SHOWN"));
    let new_diagram = get_by_name(name);
    if (!new_diagram) {
        new_diagram = diagram_factory.create(name, view_id);
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
    }
    if (save) {
        save_diagrams();
    }
    window.localStorage.setItem(name, Date.now());
    diagrams_shown += 1;
    window.localStorage.setItem("DIAGRAMS_SHOWN", diagrams_shown);
    settings.get("max-number-displayed-diagrams").then(function (max_number_diagrams) {
        if (diagrams_shown > max_number_diagrams) {
            console.log("exceeded number of diagrams to show");
            let diagram_to_hide = oldest_viewed_diagram();
            hide_diagram(diagrams[diagram_to_hide.name], false, true);
        }
    });
    return new_diagram;
};

// hides the tab of the diagram
let hide_diagram = function (diagram, show_tile, decrement) {
    $("#" + diagram.tab_id).hide();
    if (show_tile) {
        $("#channel-tiles-tab").tab("show");
    }
    if (decrement) {
        let diagrams_shown = parseInt(window.localStorage.getItem("DIAGRAMS_SHOWN"));
        window.localStorage.setItem("DIAGRAMS_SHOWN", diagrams_shown - 1);
    }
    window.localStorage.setItem(diagram.name, 'HIDDEN');
    alert.show(`${diagram.name} hidden`);
};

let remove_diagram = function (name) {
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
    window.localStorage.setItem("DIAGRAMS_SHOWN", diagrams_shown - 1);
    window.localStorage.removeItem(name);
};

let get_by_name = function (name) {
    return diagrams[name];
};

let save_diagrams = function () {
    let diagram_map = _.map(Object.values(diagrams), function (item) {
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

let load_diagrams = function () {
    return new Promise((resolve) => {
        let diagrams_shown = localStorage.getItem('DIAGRAMS_SHOWN');
        if (!diagrams_shown) {  // first load of the app, and no diagrams are being tracked yet
            localStorage.setItem('DIAGRAMS_SHOWN', 0);
            // load diagram names from the cloud on initialization
            settings.get("diagrams").then(function (saved_diagrams) {
                console.log("load user-defined diagrams: " + JSON.stringify(saved_diagrams));
                if (Array.isArray(saved_diagrams) && saved_diagrams.length > 0) {
                    for (let diagram of saved_diagrams) {
                        add_diagram(diagram.name, diagram.view_id, false);
                    }
                } else {
                    // no diagrams, create default View from previous Global View
                    console.log("no used-defined diagrams, creating default diagram");
                    add_diagram("Default", "global", true);
                }
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
    let results = [];
    if (!Array.isArray(node_ids)) {
        node_ids = [node_ids];
    }
    for (let name in diagrams) {
        let diagram = diagrams[name];
        let found = _.compact(diagram.nodes.get(node_ids));
        if (found.length === node_ids.length) {
            results.push(diagram);
        }
    }
    return _.orderBy(results, ["name"]);
}

function have_any(node_ids, match_sort = false) {
    let results = [];
    node_ids = node_ids || [];
    if (!Array.isArray(node_ids)) {
        node_ids = [node_ids];
    }
    node_ids = node_ids.sort();
    for (let diagram of Object.values(diagrams)) {
        let intersect = _.intersection(diagram.nodes.getIds().sort(), node_ids);
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

function get_hidden_diagrams() {
    let hidden_diagrams = []
    for (let [key, value] of Object.entries(localStorage)) {
        if (key != "DIAGRAMS_SHOWN" && value == "HIDDEN") {
            hidden_diagrams.push({ "hidden_diagram": key });
        }
    }
    return hidden_diagrams;
}

async function restore_diagrams() {
    // zero out the number of diagrams shown and start the count over
    localStorage.setItem('DIAGRAMS_SHOWN', 0);
    let hidden_diagrams = get_hidden_diagrams();
    settings.get("diagrams").then(function (saved_diagrams) {
        for (let diagram of saved_diagrams) {
            let this_diagram = add_diagram(diagram.name, diagram.view_id, false);
            if (_.find(hidden_diagrams, { 'hidden_diagram': diagram.name })) {
                hide_diagram(this_diagram, false, true);
            }
        }
    });
    //show tiles tab after restoring
    $("#channel-tiles-tab").tab("show");
}

function oldest_viewed_diagram() {
    let displayed_diagrams = [];
    const local_lodash = _;
    for (let [key, value] of Object.entries(localStorage)) {
        if (key != "DIAGRAMS_SHOWN") {
            displayed_diagrams.push({ "name": key, "time": value });
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
        $("#diagram-list-button").removeClass("d-none");
    } else {
        // hide the lock
        $("#diagram-lock-button").addClass("d-none");
    }
};

const update_hide_visibility = () => {
    // are we showing a diagram or tiles?
    let diagram = shown_diagram();
    if (diagram) {
        $("#diagram-hide-button").removeClass("d-none");
    } else {
        $("#diagram-hide-button").addClass("d-none");
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

const refresh_hide_compartment = () => {
    // do this relative to the diagram div
    const diagramDiv = $("#diagram");
    const buttonDiv = $("#diagram-hide-button");
    // get the location and size of the diagram div
    const diagramPosition = diagramDiv.position();
    const width = diagramDiv.width();
    // create
    const h_offset = 30;
    const v_offset = 58;
    const style = `position: absolute; top: ${diagramPosition.top + v_offset
        }px; left: ${width - h_offset}px; z-index: 500; cursor: pointer;`;
    const buttonContent = `<div id="diagram-hide-button" style="${style}"><span title="Hide Diagram" id="diagram-hide-icon" class="material-icons">cancel_presentation</span></div>`;
    buttonDiv.replaceWith(buttonContent);
    $("#diagram-hide-button").click(() => {
        let diagram = shown_diagram();
        if (diagram) {
            hide_diagram(diagram, true, true);
        }
    });
    update_hide_visibility();
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
    const v_offset = 30;
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
                alert.show(message);
            });
        });
    });
    update_lock_visibility();
};

const hidden_diagrams_tabulator = new Tabulator(
    "#hidden_diagrams_content",
    {
        placeholder: "No hidden diagrams",
        tooltips: true,
        layout: "fitDataStretch",
        selectable: true,
        selectableRangeMode: "click",
        columns: [
            {
                title: "Hidden Diagram",
                field: "hidden_diagram",
                headerFilter: true,
                cellClick: function (e, cell) {
                    let name = cell.getRow()._row.data.hidden_diagram;
                    let this_diagram = add_diagram(name, _.snakeCase(name), false);
                    this_diagram.show();
                    $("#hidden_diagrams").offcanvas("hide");
                }
            }
        ]
    }
);

const load_hidden_diagrams_list = () => {
    const diagramListDiv = $("#diagram-list-button");
    // do this relative to the diagram div
    const diagramDiv = $("#diagram");
    // get the location and size of the diagram div
    const diagramPosition = diagramDiv.position();
    const width = diagramDiv.width();
    // create
    const h_offset = 30;
    const v_offset = 2;
    const listStyle = `position: absolute; top: ${diagramPosition.top + v_offset}px; left: ${width - h_offset}px; z-index: 500; cursor: pointer;`;
    const diagramListButtonContent = `<div id="diagram-list-button" style="${listStyle}"><span title="Show List of Hidden Diagrams" id="diagram-list-icon" class="material-icons">list</span></div>`;
    diagramListDiv.replaceWith(diagramListButtonContent);
    $("#diagram-list-button").click(() => {
        $("#hidden_diagrams_lg").empty();
        // populate div inside the offcanvas with list of hidden diagrams
        let hidden_diagrams_list = get_hidden_diagrams();
        hidden_diagrams_tabulator.replaceData(hidden_diagrams_list);
        $("#hidden_diagrams").offcanvas("show");
    });
};
// detect window resize events
window.addEventListener('resize', function () {
    // reposition absolute diagram elements if needed
    refresh_hide_compartment();
    refresh_lock_compartment();
    update_lock_state();
    load_hidden_diagrams_list();
});

// this is the initialization code for the diagrams component
load_diagrams().then(() => {
    refresh_hide_compartment();
    refresh_lock_compartment();
    load_hidden_diagrams_list();
    $("#diagram-tab").on("shown.bs.tab", () => {
        update_lock_visibility();
        update_lock_state();
        update_hide_visibility();
    });
    let current_url = new URL(window.location);
    let override_diagram = current_url.searchParams.get("diagram");
    if (override_diagram) {
        console.log("Show diagram " + override_diagram + " on start");
        let diagram = get_by_name(override_diagram);
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
    get_hidden_diagrams
};
