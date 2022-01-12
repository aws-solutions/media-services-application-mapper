/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// define the various loading paths
requirejs.config({
    "baseUrl": "js/lib",
    "paths": {
        "app": "../app",
        "cookie": "/node_modules/js-cookie/src/js.cookie",
        "object_hash": "/node_modules/object-hash/dist/object_hash",
        "lodash": "/node_modules/lodash/lodash.min",
        "machina": "/node_modules/machina/lib/machina.min",
        "vis": "/node_modules/vis/dist/vis.min"
    },
    "waitSeconds": 15
});
// load the main module and go
requirejs(["app/main"]);