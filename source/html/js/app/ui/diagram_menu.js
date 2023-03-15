/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as ui_util from "./util.js";
import * as layout from "./layout.js";
import * as alert from "./alert.js";
import * as diagrams from "./diagrams.js";
import * as confirmation from "./confirmation.js";

let vary_multiplier = 8;

let inventory_tabulator = new Tabulator("#diagram_contents_inventory", {
    placeholder: "No Inventory",
    selectable: true,
    selectableRangeMode: "click",
    index: "id",
    tooltips: true,
    height: 600,
    layout: "fitColumns",
    groupBy: ["title"],
    initialSort: [{ column: "id" }, { column: "name" }],
    columns: [
        {
            title: "Name",
            field: "name",
            headerFilter: true,
        },
        {
            title: "AWS Region",
            field: "region",
            headerFilter: true,
        },
        {
            title: "ARN",
            field: "id",
            headerFilter: true,
        },
    ],
});

let diagram_tabulator = new Tabulator("#diagram_contents_diagram", {
    placeholder: "No Diagram Contents",
    selectable: true,
    selectableRangeMode: "click",
    index: "id",
    tooltips: true,
    height: 600,
    layout: "fitColumns",
    groupBy: ["title"],
    initialSort: [{ column: "id" }, { column: "name" }],
    columns: [
        {
            title: "Name",
            field: "name",
            headerFilter: true,
        },
        {
            title: "AWS Region",
            field: "region",
            headerFilter: true,
        },
        {
            title: "ARN",
            field: "id",
            headerFilter: true,
        },
    ],
});

$("#diagram_remove_selected").on("click", function () {
    let shown = diagrams.shown();
    if (shown) {
        let selected = shown.network.getSelectedNodes();
        if (Array.isArray(selected) && selected.length > 0) {
            let html = `Remove ${selected.length} node${
                selected.length == 1 ? "" : "s"
            } from the diagram?`;
            confirmation.show(html, function () {
                shown.nodes.remove(selected);
                let message = `${selected.length} node${
                    selected.length == 1 ? "" : "s"
                } removed`;
                alert.show(message);
            });
        }
    }
});

$("#diagram_add_downstream").on("click", function () {
    add_downstream_nodes();
});

function add_downstream_nodes() {
    let shown = diagrams.shown();
    if (shown) {
        let selected = shown.network.getSelectedNodes();
        let connected = [];
        for (let node_id of selected) {
            if (!connected.includes(node_id)) {
                connected.push(node_id);
                ui_util.get_downstream(model.edges, node_id, connected);
            }
        }
        connected.sort();
        // only add nodes not yet on the diagram
        let add_nodes = _.difference(
            connected,
            shown.nodes.getIds().sort()
        );
        // use _.compact to remove nulls if id not found
        let nodes = _.compact(model.nodes.get(add_nodes));
        let view = shown.network.getViewPosition();
        shown.nodes.update(nodes);
        for (let node of nodes) {
            shown.network.moveNode(
                node.id,
                ui_util.vary(view.x, node.size * vary_multiplier),
                ui_util.vary(view.y, node.size * vary_multiplier)
            );
        }
        let node_ids = _.map(nodes, "id");
        layout.save_layout(shown, node_ids);
        shown.network.fit();
    }
}

$("#diagram_add_upstream").on("click", function () {
    add_upstream_nodes();
});

function add_upstream_nodes() {
    let shown = diagrams.shown();
    if (shown) {
        let selected = shown.network.getSelectedNodes();
        let connected = [];
        for (let node_id of selected) {
            if (!connected.includes(node_id)) {
                connected.push(node_id);
                ui_util.get_upstream(model.edges, node_id, connected);
            }
        }
        // only add nodes not yet on the diagram
        connected.sort();
        let add_nodes = _.difference(
            connected,
            shown.nodes.getIds().sort()
        );
        // use _.compact to remove nulls if id not found
        let nodes = _.compact(model.nodes.get(add_nodes));
        let view = shown.network.getViewPosition();
        shown.nodes.update(nodes);
        for (let node of nodes) {
            shown.network.moveNode(
                node.id,
                ui_util.vary(view.x, node.size * vary_multiplier),
                ui_util.vary(view.y, node.size * vary_multiplier)
            );
        }
        let node_ids = _.map(nodes, "id");
        layout.save_layout(shown, node_ids);
        shown.network.fit();
    }
}

$("#diagram_add_all_nodes").on("click", function () {
    add_downstream_nodes();
    add_upstream_nodes();
});

let set_create_diagram_alert = function (message) {
    let html = `<div id="create_diagram_dialog_alert" class="alert alert-danger" role="alert">${message}</div>`;
    $("#create_diagram_dialog_alert").replaceWith(html);
};

let clear_create_diagram_alert = function () {
    let html = `<div id="create_diagram_dialog_alert"></div>`;
    $("#create_diagram_dialog_alert").replaceWith(html);
};

$("#create_diagram_dialog").on("shown.bs.modal", function () {
    clear_create_diagram_alert();
    $("#create_diagram_dialog_name").val("");
    $("#create_diagram_dialog_name").focus();
});

$("#create_diagram_dialog_proceed").on("click", function () {
    try {
        // get the name
        let name = filterXSS($("#create_diagram_dialog_name").val());
        // check it
        let valid_name = /^\w+/;
        if (valid_name.test(name)) {
            // create a new diagram
            let d = diagrams.add(name, _.snakeCase(name), true);
            alert.show("Diagram created");
            // hide the dialog
            $("#create_diagram_dialog").modal("hide");
            // select the new tab
            d.show();
        } else {
            set_create_diagram_alert(
                "Names must start with an alphanumeric character"
            );
        }
    } catch (error) {
        console.log(error);
        set_create_diagram_alert(
            "Names must start with an alphanumeric character"
        );
    }
});

let set_dupe_diagram_alert = function (message) {
    let html = `<div id="dupe_diagram_dialog_alert" class="alert alert-danger" role="alert">${message}</div>`;
    $("#dupe_diagram_dialog_alert").replaceWith(html);
};

let clear_dupe_diagram_alert = function () {
    let html = `<div id="dupe_diagram_dialog_alert"></div>`;
    $("#dupe_diagram_dialog_alert").replaceWith(html);
};

$("#dupe_diagram_dialog").on("shown.bs.modal", function () {
    clear_dupe_diagram_alert();
    $("#dupe_diagram_dialog_name").val("");
    $("#dupe_diagram_dialog_name").focus();
});

$("#dupe_diagram_dialog_proceed").on("click", function () {
    let current_diagram = diagrams.shown();
    if (current_diagram) {
        try {
            // get the name
            let name = filterXSS($("#dupe_diagram_dialog_name").val());
            // check it
            let valid_name = /^\w+/;
            if (valid_name.test(name)) {
                // create a new diagram
                let new_diagram = diagrams.add(name, _.snakeCase(name), true);
                new_diagram.nodes.update(current_diagram.nodes.get());
                let positions = current_diagram.network.getPositions();
                for (let key of Object.keys(positions)) {
                    new_diagram.network.moveNode(
                        key,
                        positions[key].x,
                        positions[key].y
                    );
                }
                layout.save_layout(new_diagram);
                alert.show("Diagram duplicated");
                // hide the dialog
                $("#dupe_diagram_dialog").modal("hide");
                // select the new tab
                new_diagram.show();
            } else {
                set_dupe_diagram_alert(
                    "Names must start with an alphanumeric character"
                );
            }
        } catch (error) {
            console.log(error);
            set_dupe_diagram_alert(
                "Names must start with an alphanumeric character"
            );
        }
    }
});

$("#add-diagram-button,#diagram_add_diagram").on("click", function () {
    $("#create_diagram_dialog").modal("show");
});

$("#duplicate-diagram-button,#diagram_duplicate_diagram").on(
    "click",
    function () {
        let diagram = diagrams.shown();
        if (diagram) {
            $("#dupe_diagram_dialog").modal("show");
        }
    }
);

$("#remove-diagram-button,#diagram_remove_diagram").on("click", function () {
    let diagram = diagrams.shown();
    if (diagram) {
        let html = `Permanently remove ${diagram.name} diagram?`;
        confirmation.show(html, function () {
            diagram.nodes.remove(diagram.nodes.getIds());
            diagrams.remove(diagram.name);
            let message = `${diagram.name} removed`;
            alert.show(message);
        });
    }
});

$("#diagram_hide_diagram").on("click", function () {
    let diagram = diagrams.shown();
    if (diagram) {
        diagrams.hide(diagram, true, true);
    }
});

$("#diagram_contents_modal").on("shown.bs.modal", function () {
    inventory_tabulator.setData(model.nodes.get());
    let current = diagrams.shown();
    diagram_tabulator.setData(current.nodes.get());
});

$("#manage-diagram-contents-button,#diagram_manage_contents").on(
    "click",
    function () {
        if (diagrams.shown()) {
            $("#diagram_contents_modal").modal("show");
        }
    }
);

$("#add-selected-to-diagram").on("click", function () {
    let inv_selected = inventory_tabulator.getSelectedData();
    diagram_tabulator.updateOrAddData(inv_selected);
});

$("#remove-selected-from-diagram").on("click", function () {
    let selectedRows = diagram_tabulator.getSelectedRows();
    for (let row of selectedRows) {
        row.delete();
    }
});

$("#add-all-to-diagram").on("click", function () {
    diagram_tabulator.setData(inventory_tabulator.getData());
});

$("#remove-all-from-diagram").on("click", function () {
    diagram_tabulator.setData([]);
});

$("#diagram_contents_save").on("click", function () {
    let diagram = diagrams.shown();
    let tabulator_node_ids = _.map(diagram_tabulator.getData(), "id").sort();
    let diagram_node_ids = diagram.nodes.getIds().sort();
    let add_ids = _.difference(tabulator_node_ids, diagram_node_ids);
    let remove_ids = _.difference(diagram_node_ids, tabulator_node_ids);
    let nodes = _.compact(model.nodes.get(add_ids));
    diagram.network.once("afterDrawing", function () {
        diagram.network.fit();
    });
    diagram.nodes.update(nodes);
    diagram.nodes.remove(remove_ids);
    // // hide the dialog
    $("#diagram_contents_modal").modal("hide");
});
