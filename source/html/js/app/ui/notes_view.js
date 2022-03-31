/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as model from "../model.js";
import * as channels from "../channels.js";
import * as tile_view from "./tile_view.js";
import * as diagrams from "./diagrams.js";
import * as notes from "../notes.js";
import * as confirmation from "./confirmation.js";
import * as alert from "./alert.js";


var data_div_id = "nav-data";
var alerts_div_id = "nav-alerts";
var alarms_div_id = "nav-alarms";
var events_div_id = "nav-events";
var notes_div_id = "nav-notes";

var data_tab_id = "nav-data-tab";
var alerts_tab_id = "nav-alerts-tab";
var alarms_tab_id = "nav-alarms-tab";
var events_tab_id = "nav-events-tab";
var notes_tab_id = "nav-notes-tab";

var delete_notes_button = "delete-notes";
var edit_notes_button = "edit-notes";
var save_notes_button = "save-notes";
var cancel_notes_button = "cancel-notes";

var rendered_notes_div_id = "notes-rendered-markdown";
var editable_notes_div_id = "notes-editable-markdown";
var notes_textarea_id = "notes-textarea";

var display_selected_nodes = function (diagram, node_ids) {
    let resource_info = resource_selected();
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

var display_selected_edges = function () {
    // var edge = model.edges.get(edges[0]);
    // console.log(edge.id);
    let resource_info = resource_selected();
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

var display_selected_tile = function () {
    let resource_info = resource_selected();
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

var display_no_selection = function () {
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
var hide_elements = function (element_list) {
    for (let id in element_list) {
        $("#" + element_list[id]).addClass("d-none");
    }
};

// accepts a list of element IDs to show
var show_elements = function (element_list) {
    // iterate through tabs to show
    for (let id in element_list) {
        $("#" + element_list[id]).removeClass("d-none");
    }
};

$("#" + edit_notes_button).click(() => {
    console.log('edit notes button clicked');    
    let resource_info = resource_selected();
    console.log("resource is " + resource_info.header + resource_info.id);
    // hide rendered notes
    hide_elements([rendered_notes_div_id]);
    // replace the resource's header
    $("#notes-editable-markdown-header").html(resource_info.header);
    // get the notes for this resource and put in textarea
    $("#" + notes_textarea_id).val('');
    notes.get_resource_notes(resource_info.id).then(function (this_note) {
        if(this_note?.length > 0) {
            console.log("this note: " + this_note[0].notes);
            $("#" + notes_textarea_id).val(this_note[0].notes);
        }
    });
    show_elements([editable_notes_div_id]);
});

$("#" + delete_notes_button).click(() => {
    console.log('delete notes button clicked');
    let resource_info = resource_selected();
    let html = "remove notes for realz?";
    confirmation.show(html, function () {
        notes.delete_resource_notes(resource_info.id).then(function(result) {
            console.log(result);
            alert.show("Notes deleted");
            render_html_notes(resource_info);
        });
    });
});

$("#" + save_notes_button).click(() => {
    console.log('save notes button clicked');
    let resource_info = resource_selected();
    let notes_value = $("#" + notes_textarea_id).val();
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
    console.log('cancel notes button clicked');
    hide_elements([editable_notes_div_id]);
    let resource_info = resource_selected();
    render_html_notes(resource_info);
    show_elements([rendered_notes_div_id]);
});

// figure out what has been selected: node, edge, or tile
// return id and type/name
var resource_selected = function() {
    var diagram = diagrams.shown();
    var resource_info = {};
    if (diagram != null) {
        // either node or edge is selected
        let selected = diagram.network.getSelectedNodes();
        if (selected.length > 0) {
            let node = model.nodes.get(selected[0]);
            console.log(node.header);
            resource_info.header = node.header;
        }
        else {
            selected = diagram.network.getSelectedEdges();
            let edge = model.edges.get(selected[0]);
            let toNode = model.nodes.get(edge.to);
            let fromNode = model.nodes.get(edge.from);
            console.log(edge);
            resource_info.header = `Connection from ${fromNode.title} to ${toNode.title}`;
        }
        console.log(selected);
        resource_info.id = selected[0];
    }
    else {
        resource_info.id = tile_view.selected();
        resource_info.header = `Tile: ${resource_info.id}`;
    }
    return resource_info;
};

var render_html_notes = function (resource) {
    var html;
    $("#" + rendered_notes_div_id).empty();
    var header = `<h6 class="card-subtitle mb-2 text-muted">${resource.header}</h6><br/>`;

    $("#" + rendered_notes_div_id).append(header);
    notes.get_resource_notes(resource.id).then(function (this_note) {
        if(this_note?.length > 0) {
            let converter = new showdown.Converter();
            let text = this_note[0].notes;
            html = converter.makeHtml(text);
        }
        else {
            html = `<p> No notes for this resource. </p>`;
        }
        $("#" + rendered_notes_div_id).append(html);
    });
};

var tile_view_listener = function (name, members) {
    var selected = tile_view.selected();
    if (selected === name) {
        display_selected_tile(name, members);
    } else if (selected) {
        channels.retrieve_channel(selected).then((members) => {
            display_selected_tile(selected, members);
        });
    } else {
        display_no_selection();
    }
};

diagrams.add_selection_callback(function (diagram, event) {
    if (event.nodes.length > 0) {
        display_selected_nodes(diagram, event.nodes);
    } else if (event.edges.length > 0) {
        display_selected_edges(diagram, event.edges);
    } else if (event.nodes.length == 0 && event.edges.length == 0) {
        display_no_selection();
    }
});

tile_view.add_selection_callback(tile_view_listener);


