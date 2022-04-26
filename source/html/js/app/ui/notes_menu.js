/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as notes from "../notes.js";
import * as tiles from "../channels.js";
import * as confirmation from "./confirmation.js";
import * as alert from "./alert.js";


var trashIcon = function () {
    return `<i class='fa fa-trash'></i>`;
};

const notes_tabulator = new Tabulator(
    "#manage_notes_inventory",
    {
        placeholder: "No Notes to Show",
        tooltips: true,
        groupBy: ["type"],
        initialSort: [{ column: "timestamp" }],
        height: 400, 
        layout: "fitColumns",
        selectable: true,
        selectableRangeMode: "click",
        columns: [
            {
                title: "ARN",
                field: "resource_arn",
                headerFilter: true,
                width: 200
            },
            {
                title: "Updated Time",
                field: "timestamp",
                headerFilter: true,
                width: 200
            },
            {
                title: "Notes (truncated to 200 chars)",
                field: "notes",
                headerFilter: true,
                formatter: "html"
            },
            {
                title: "Resource Exists",
                field: "exists",
                headerFilter: true,
                width: 175
            },
            {
                tooltip: "Delete Note",
                headerSort: false,
                formatter: trashIcon,
                width: 40,
                hozAlign: "center",
                cellClick: function (e, cell) {
                    delete_note(cell.getRow()._row.data);
                }
            }
        ]
    }
);

$("#manage_notes_button").on("click", function () {
    set_notes_data();
    $("#manage_notes_modal").modal("show");
});

$("#close_notes_button").on("click", function () {
    $("#manage_notes_modal").modal("hide");
});

function delete_note(row) {
    let html = "You are about to delete this note. Proceed?";
    confirmation.show(html, function () {
        notes.delete_resource_notes(row.resource_arn).then(function(result) {
            console.log(result);
            alert.show("Notes deleted");
            set_notes_data();
        });
    });
}

function set_notes_data() {
    const local_lodash = _;
    var tiles_list;
    var nodes_list = model.nodes.get();
    var edges_list = model.edges.get();
    tiles.channel_list().then(function (results) {
        tiles_list = results;
    });
    notes.get_all_resource_notes().then(function (all_notes) {
        for (let note of all_notes) {
            let converter = new showdown.Converter();
            // truncate notes to 200 characters
            let text = note.notes.slice(0, 200);
            note.notes = converter.makeHtml(text);
            note.exists = "No";
            note.timestamp = new Date(note.timestamp*1000).toISOString();
            // does the resource associated with this note exist
            switch (note.type) {
                case "Tile":
                    if (local_lodash.includes(tiles_list, note.resource_arn)){
                        note.exists = "Yes";
                    }
                    break;
                case "Edge":
                    for (let edge of edges_list){
                        if (local_lodash.includes(edge, note.resource_arn)){
                            note.exists = "Yes";
                            break;
                        }
                    }
                    break;
                case "Node":
                    for (let node of nodes_list){
                        if (local_lodash.includes(node, note.resource_arn)){
                            note.exists = "Yes";
                            break;
                        }
                    }
            }
        }
        notes_tabulator.replaceData(all_notes);
    });
}