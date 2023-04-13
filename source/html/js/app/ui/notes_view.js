/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as channels from "../channels.js";
import * as tile_view from "./tile_view.js";
import * as diagrams from "./diagrams.js";
import * as notes from "../notes.js";
import * as confirmation from "./confirmation.js";
import * as alert from "./alert.js";


const data_div_id = "nav-data";
const alerts_div_id = "nav-alerts";
const alarms_div_id = "nav-alarms";
const events_div_id = "nav-events";
const notes_div_id = "nav-notes";

const data_tab_id = "nav-data-tab";
const alerts_tab_id = "nav-alerts-tab";
const alarms_tab_id = "nav-alarms-tab";
const events_tab_id = "nav-events-tab";
const notes_tab_id = "nav-notes-tab";

const delete_notes_button = "delete-notes";
const edit_notes_button = "edit-notes";
const save_notes_button = "save-notes";
const cancel_notes_button = "cancel-notes";

const rendered_notes_div_id = "notes-rendered-markdown";
const editable_notes_div_id = "notes-editable-markdown";
const notes_textarea_id = "notes-textarea";

const display_selected_nodes = function (diagram, node_ids) {
    const resource_info = resource_selected();
    render_html_notes(resource_info);

    // if node is managed instance, alerts and cloudwatch events don't apply
    // if medialive channel/multiplex or mediaconnect flow, alerts apply
    if (node_ids[0].includes("managed-instance")) {
        show_elements([data_div_id, 
            alarms_div_id, 
            notes_div_id, 
            data_tab_id, 
            alarms_tab_id, 
            notes_tab_id,
            rendered_notes_div_id
            ]);
        hide_elements([
            alerts_div_id,
            events_div_id,
            alerts_tab_id,
            events_tab_id,
            editable_notes_div_id
        ]);
    } else if (
        (node_ids[0].includes("medialive") &&
            node_ids[0].includes("channel")) ||
        node_ids[0].includes("multiplex") ||
        node_ids[0].includes("mediaconnect")
    ) {
        show_elements([
            data_div_id,
            alerts_div_id,
            alarms_div_id,
            events_div_id,
            notes_div_id,
            data_tab_id,
            alarms_tab_id,
            alerts_tab_id,
            events_tab_id,
            notes_tab_id,
            rendered_notes_div_id
        ]);
        hide_elements([editable_notes_div_id]);
    } else {
        show_elements([
            data_div_id,
            alarms_div_id,
            events_div_id,
            notes_div_id,
            data_tab_id,
            alarms_tab_id,
            events_tab_id,
            notes_tab_id,
            rendered_notes_div_id
        ]);
        hide_elements([alerts_div_id, alerts_tab_id, editable_notes_div_id]);
    }
};

const display_selected_edges = function () {
    const resource_info = resource_selected();
    render_html_notes(resource_info);
    show_elements([data_div_id, 
        notes_div_id, 
        data_tab_id, 
        notes_tab_id, 
        rendered_notes_div_id]);
    hide_elements([
        alarms_div_id,
        alerts_div_id,
        events_div_id,
        alarms_tab_id,
        alerts_tab_id,
        events_tab_id,
        editable_notes_div_id
    ]);
};

const display_selected_tile = function () {
    const resource_info = resource_selected();
    render_html_notes(resource_info);
    show_elements([
        data_tab_id,
        alarms_tab_id,
        alerts_tab_id,
        data_div_id,
        alarms_div_id,
        alerts_div_id,
        notes_tab_id,
        notes_div_id,
        rendered_notes_div_id
    ]);
    hide_elements([events_tab_id, events_div_id, editable_notes_div_id]);
};

const display_no_selection = function () {
    hide_elements([
        data_tab_id,
        alarms_tab_id,
        alerts_tab_id,
        events_tab_id,
        notes_tab_id,
        data_div_id,
        alerts_div_id,
        alarms_div_id,
        events_div_id,
        notes_div_id
    ]);
};

// accepts a list of element IDs to hide
const hide_elements = function (element_list) {
    for (const id in element_list) {
        $("#" + element_list[id]).addClass("d-none");
    }
};

// accepts a list of element IDs to show
const show_elements = function (element_list) {
    // iterate through tabs to show
    for (const id in element_list) {
        $("#" + element_list[id]).removeClass("d-none");
    }
};

$("#" + edit_notes_button).click(() => {
    const resource_info = resource_selected();
    // hide rendered notes
    hide_elements([rendered_notes_div_id]);
    // replace the resource's header
    $("#notes-editable-markdown-header").html(resource_info.header);
    // get the notes for this resource and put in textarea
    $("#" + notes_textarea_id).val('');
    notes.get_resource_notes(resource_info.id).then(function (this_note) {
        if(this_note?.length > 0) {
            const scrubbed_notes = filterXSS(this_note[0].notes);
            $("#" + notes_textarea_id).val(scrubbed_notes);
        }
    });
    show_elements([editable_notes_div_id]);
});

$("#" + delete_notes_button).click(() => {
    const resource_info = resource_selected();
    const html = "You are about to delete this note. Proceed?";
    confirmation.show(html, function () {
        notes.delete_resource_notes(resource_info.id).then(function(result) {
            console.log(result);
            alert.show("Notes deleted");
            render_html_notes(resource_info);
        });
    });
});

$("#" + save_notes_button).click(() => {
    const resource_info = resource_selected();
    const notes_value = filterXSS($("#" + notes_textarea_id).val());
    notes.update_resource_notes(resource_info.id, notes_value).then(function (response) {
        alert.show("Notes saved");
        console.log(response);
        // after saving, hide the textarea, and show the rendered notes
        hide_elements([editable_notes_div_id]);
        render_html_notes(resource_info);
        show_elements([rendered_notes_div_id]);
    });
});

$("#" + cancel_notes_button).click(() => {
    hide_elements([editable_notes_div_id]);
    const resource_info = resource_selected();
    render_html_notes(resource_info);
    show_elements([rendered_notes_div_id]);
});

// figure out what has been selected: node, edge, or tile
// return id and type/name
const resource_selected = function() {
    const diagram = diagrams.shown();
    const resource_info = {};
    if (diagram != null) {
        // either node or edge is selected
        let selected = diagram.network.getSelectedNodes();
        if (selected.length > 0) {
            const node = model.nodes.get(selected[0]);
            resource_info.header = node.header;
        }
        else {
            selected = diagram.network.getSelectedEdges();
            const edge = model.edges.get(selected[0]);
            const toNode = model.nodes.get(edge.to);
            const fromNode = model.nodes.get(edge.from);
            resource_info.header = `Connection from ${fromNode.title} to ${toNode.title}`;
        }
        resource_info.id = selected[0];
    }
    else {
        resource_info.id = tile_view.selected();
        resource_info.header = `Tile: ${resource_info.id}`;
    }
    return resource_info;
};

const render_html_notes = function (resource) {
    let html;
    $("#" + rendered_notes_div_id).empty();
    const header = `<h6 class="card-subtitle mb-2 text-muted">${resource.header}</h6><br/>`;

    $("#" + rendered_notes_div_id).append(header);
    notes.get_resource_notes(resource.id).then(function (this_note) {
        if(this_note?.length > 0) {
            const converter = new showdown.Converter();
            const text = this_note[0].notes;
            html = converter.makeHtml(text);
        }
        else {
            html = `<p> No notes for this resource. </p>`;
        }
        $("#" + rendered_notes_div_id).append(html);
    });
};

const tile_view_listener = function (name) {
    const selected = tile_view.selected();
    if (selected === name) {
        display_selected_tile();
    } else if (selected) {
        channels.retrieve_channel(selected).then(() => {
            display_selected_tile();
        });
    } else {
        display_no_selection();
    }
};

diagrams.add_selection_callback(function (diagram, event) {
    if (event.nodes.length > 0) {
        display_selected_nodes(diagram, event.nodes);
    } else if (event.edges.length > 0) {
        display_selected_edges();
    } else if (event.nodes.length == 0 && event.edges.length == 0) {
        display_no_selection();
    }
});

tile_view.add_selection_callback(tile_view_listener);


