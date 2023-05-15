/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as diagrams from "./diagrams.js";
import * as model from "../model.js";
import * as alert from "./alert.js";

const add_connection_compartment = "connect-nodes-button";
const remove_connection_compartment = "delete-connection-button";
const add_connection_button = "connect-nodes-button";
const remove_connection_button = "delete-connection-button";
const label_edit_compartment = "edit-connection-button";
const label_edit_button = "edit-connection-button";

const create_connection_record = function (options) {
    const updated = moment(new Date());
    const expires = moment(updated).add(1, "y");
    const data = {
        "user-defined": true,
        from: `${options.from}`,
        to: `${options.to}`,
        expires: options.expires || expires.unix(),
    };
    return {
        arn: `${options.from}:${options.to}`,
        data: JSON.stringify(data),
        expires: options.expires || expires.unix(),
        label: options.label || "new connection",
        from: `${options.from}`,
        region: "global",
        service: "user-defined-connection",
        to: `${options.to}`,
        updated: updated.unix(),
    };
};

const show_add_connection = (visible) => {
    if (visible) {
        $("#" + add_connection_compartment).removeClass("hidden-compartment");
    } else {
        $("#" + add_connection_compartment).addClass("hidden-compartment");
    }
};

const show_remove_connection = (visible) => {
    if (visible) {
        $("#" + remove_connection_compartment).removeClass(
            "hidden-compartment"
        );
    } else {
        $("#" + remove_connection_compartment).addClass("hidden-compartment");
    }
};

const show_edit_connection = (visible) => {
    if (visible) {
        $("#" + label_edit_compartment).removeClass("hidden-compartment");
    } else {
        $("#" + label_edit_compartment).addClass("hidden-compartment");
    }
};

$("#" + add_connection_button).click(() => {
    // add a connection to the model
    show_add_connection(false);
    const diagram = diagrams.shown();
    console.log(`diagram is ${diagram.name}`);
    const selected = diagram.network.getSelectedNodes();
    if (selected.length == 2) {
        // add the new connection to the REST API
        const record = create_connection_record({
            from: selected[0],
            to: selected[1],
        });
        // write the table first, don't wait
        model
            .put_records(record)
            .then(function () {
                alert.show("Saved connection");
            })
            .catch(function (error) {
                console.error(error);
                alert.show("Error saving connection");
            });
        // update in-memory model
        model.edges.update({
            id: record.arn,
            to: record.to,
            from: record.from,
            label: record.label,
            data: JSON.parse(record.data),
            arrows: "to",
            color: {
                color: "black",
            },
        });
        // refresh each diagram containing to and from nodes
        const matches = diagrams.have_all([record.to, record.from]);
        for (const match of matches) {
            // we only need to sync one side of the connection
            match.synchronize_edges("add", [record.from]);
        }
        // done
    } else {
        console.log("only two nodes can be selected");
    }
});

$("#" + remove_connection_button).click(() => {
    show_remove_connection(false);
    show_edit_connection(false);
    const diagram = diagrams.shown();
    console.log(`diagram is ${diagram.name}`);
    const selected = diagram.network.getSelectedEdges();
    if (selected.length == 1) {
        const edge = model.edges.get(selected[0]);
        // delete the connection from the REST API
        model
            .delete_record(edge.id)
            .then(function () {
                alert.show("Deleted");
            })
            .catch(function (error) {
                console.error(error);
                alert.show("Error deleting connection");
            });
        // refresh the diagrams
        model.edges.remove(edge.id);
        // refresh each diagram containing to and from nodes
        const matches = diagrams.have_all([edge.to, edge.from]);
        for (const match of matches) {
            // we only need to sync one side of the connection
            match.edges.remove(edge.id);
        }
        // done
    } else {
        console.log("only one connection can be selected");
    }
});

$("#" + label_edit_button).click(() => {
    // open the create/edit connection dialog
    $("#edit_connection_dialog_expiration").datepicker({
        format: "yyyy-mm-dd",
        startDate: new Date().toDateString(),
    });
    $("#edit_connection_dialog").modal("show");
    // update the dialog fields
    const diagram = diagrams.shown();
    console.log(`diagram is ${diagram.name}`);
    const selected = diagram.network.getSelectedEdges();
    if (selected.length == 1) {
        const edge = model.edges.get(selected[0]);
        $("#edit_connection_dialog_label").val(edge.label);
        const expires = new Date();
        expires.setTime(edge.data.expires * 1000);
        const initial = `${expires.getFullYear()}/${
            expires.getMonth() + 1
        }/${expires.getDate()}`;
        $("#edit_connection_dialog_expiration").datepicker("update", initial);
    }
});

$("#edit_connection_dialog_proceed").click(() => {
    $("#edit_connection_dialog").modal("hide");
    const expires_seconds = moment(
        $("#edit_connection_dialog_expiration").val()
    ).format("X");
    const diagram = diagrams.shown();
    console.log(`diagram is ${diagram.name}`);
    const selected = diagram.network.getSelectedEdges();
    if (selected.length == 1) {
        const edge = model.edges.get(selected[0]);
        const new_expires = Number.parseInt(expires_seconds);
        const new_label = $("#edit_connection_dialog_label").val();
        // add the new connection to the REST API
        const record = create_connection_record({
            from: edge.from,
            to: edge.to,
            label: new_label,
            expires: new_expires,
        });
        // write the table first
        model
            .put_records(record)
            .then(function () {
                // done
                alert.show("Saved");
            })
            .catch(function (error) {
                console.error(error);
                alert.show("Error saving changes");
            });
        // refresh the diagrams
        const updated_edge = {
            id: edge.id,
            to: edge.to,
            from: edge.from,
            label: record.label,
            data: JSON.parse(record.data),
            arrows: "to",
            color: {
                color: "black",
            },
        };
        // update in-memory model
        model.edges.update(updated_edge);
        // refresh each diagram containing to and from nodes
        const matches = diagrams.have_all([edge.to, edge.from]);
        for (const match of matches) {
            match.edges.update(updated_edge);
        }
    } else {
        console.log("only one connection can be selected");
    }
});

diagrams.add_selection_callback(function (diagram, event) {
    if (event.nodes.length == 2) {
        diagram = diagrams.shown();
        const connected = diagram.network.getConnectedNodes(event.nodes[0]);
        if (!connected.includes(event.nodes[1])) {
            show_add_connection(true);
        }
    } else {
        show_add_connection(false);
    }
    if (event.edges.length == 1 && event.nodes.length == 0) {
        diagram = diagrams.shown();
        const edge = diagram.edges.get(event.edges[0]);
        show_remove_connection(edge.data["user-defined"]);
        show_edit_connection(edge.data["user-defined"]);
    } else {
        show_remove_connection(false);
        show_edit_connection(false);
    }
});
