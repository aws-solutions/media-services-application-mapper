/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// define the various loading paths
requirejs.config({
    "baseUrl": "js/lib",
    "paths": {
        "app": "../app",
        "automerge": "/external/npm/automerge@0.7.8/dist/automerge.min",
        "cookie": "/external/npm/js-cookie@2.2.0/src/js.cookie.min",
        "fuse": "/external/ajax/libs/fuse.js/3.4.5/fuse.min",
        "object_hash": "/external/gh/puleos/object-hash/dist/object_hash",
        "levenshtein": "/external/npm/fast-levenshtein@2.0.6/levenshtein.min",
        "lodash": "/external/ajax/libs/lodash.js/4.17.15/lodash.min",
        "machina": "/external/npm/machina@2.0.2/lib/machina.min",
        "vis": "/external/ajax/libs/vis/4.21.0/vis.min"
    },
    "waitSeconds": 15
});
// load the main module and go
requirejs(["app/main"]);