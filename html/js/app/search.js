/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/model", "app/channels"], function($, model, channels) {
    // options for Fuse
    var model_options = {
        shouldSort: true,
        tokenize: true,
        matchAllTokens: true,
        threshold: 0.25,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 2,
        keys: [
            "id",
            "label",
            "title",
            "name",
            "data.Arn",
            "data.ARN",
            "data.Channel",
            "data.DomainName",
            "data.Id",
            "data.Name",
            "data.Url",
            "data.Sources.Url",
            "data.Origin.Items.DomainName",
            "data.Origin.Items.OriginPath",
            "data.Destinations.Settings.Url",
            "data.HlsIngest.IngestEndpoints.Url"
        ]
    };

    var fuse_model;

    var cached_tile_names;

    var update_timer;

    var update = function() {
        fuse_model = new Fuse(model.nodes.get(), model_options);
        channels.cached_channel_list().then(function(channels) {
            cached_tile_names = channels;
            // console.log(cached_tile_names);
        });
    };

    var search_nodes = function(text) {
        return fuse_model.search(text);
    };

    var search_tiles = function(text) {
        var matches = [];
        cached_tile_names.forEach(function(name) {
            if (name.toLowerCase().includes(text.toLowerCase())) {
                matches.push(name);
            }
        });
        return matches;
    };

    // update at most once/second
    var update_needed = function() {
        if (undefined === update_timer) {
            update_timer = setTimeout(function() {
                update_timer = undefined;
                update();
                // console.log("search index updated");
            }, 1000);
        }
    };

    model.nodes.on("*", function(event, properties, senderId) {
        update_needed();
    });

    update_needed();

    return {
        "search_nodes": search_nodes,
        "search_tiles": search_tiles,
        "update": update
    };
});