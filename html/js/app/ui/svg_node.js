/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/window", "app/ui/util", "app/plugins"], function($, _, window, ui_util, plugins) {

    var cache = {};
    var max_line_length = 20;

    var work_div_id = ui_util.makeid();
    var work_div_html = `<div id="${work_div_id}" style="overflow: hidden; top: -100%; left: -100%; position: absolute; opacity: 0;"></div>`;
    var border_rgb = "#a6a6a6";
    var selected_border_rgb = "#262626";

    function wordWrap(str, max) {
        if (str.length > 20) {
            str = str.substring(0, 19) + " ...";
        }
        var lines = [];
        var current_line = "";
        for (var position = 0; position < str.length; position++) {
            if (current_line.length >= max && /\W/.test(str[position])) {
                lines.push(current_line);
                current_line = "";
            }
            current_line += str[position];
        }
        if (current_line.length > 0) {
            lines.push(current_line);
        }
        return lines;
    }

    var create = function(type_name, node_name, node_rgb, selected, id) {
        var font_size = 25;
        var radius = 20;
        var width = 400;
        var height = 200;
        var inc_y = 35;
        var pos_y = 10;
        var w_border = Math.ceil(width * 0.025);
        // var h_border = height * 0.05;
        $("#" + work_div_id).empty();
        var drawing = SVG(work_div_id).size(width, height);
        drawing.rect(width, height).radius(radius).fill(selected ? selected_border_rgb : border_rgb);
        drawing.rect(width - w_border, height - w_border).radius(radius).fill(node_rgb).dmove(w_border / 2, w_border / 2);
        var typeLabel = drawing.text(type_name + ":").y(pos_y);
        typeLabel.font({
            family: 'Arial',
            size: font_size,
            weight: 'bold'
        });
        typeLabel.cx(width / 2);
        pos_y += inc_y;
        var lines = wordWrap(node_name, max_line_length);
        lines.forEach(function(value, index, list) {
            var nameLabel = drawing.text(value).y(pos_y);
            nameLabel.font({
                family: 'Arial',
                size: font_size
            });
            nameLabel.cx(width / 2);
            pos_y += inc_y;
        });

        // give matching overlays a chance to supplement 'drawing'
        var overlays = plugins.overlays;
        overlays.forEach(function(module) {
            var overlay = require(module);
            if (overlay.match_type == type_name) {
                // console.log("applying overlay " + overlay.name);
                overlay.decorate(drawing, font_size, width, height, id);
            }
        });

        // export the SVG and turn it into an encoded inline image
        var code = drawing.svg();
        var inline_image = 'data:image/svg+xml;base64,' + window.btoa(code);
        return inline_image;
    };

    var unselected = function(type_name, node_name, node_rgb, id) {
        return create(type_name, node_name, node_rgb, false, id);
    };

    var selected = function(type_name, node_name, node_rgb, id) {
        return create(type_name, node_name, node_rgb, true, id);
    };

    var alert = function(type_name, node_name, id) {
        return create(type_name, node_name, "#ff0000", false, id);
    };

    // add the hidden SVG rendering div to the end of the body
    $("body").append(work_div_html);

    return {
        "unselected": function(type_name, node_name, node_rgb, id) {
            return unselected(type_name, node_name, node_rgb, id);
        },
        "selected": function(type_name, node_name, node_rgb, id) {
            return selected(type_name, node_name, node_rgb, id);
        },
        "alert": function(type_name, node_name, node_rgb, id) {
            return alert(type_name, node_name, node_rgb, id);
        }
    };
});