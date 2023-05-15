/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "./server.js";

export function ping(url, api_key) {
    const current_endpoint = `${url}/ping`;
    return server.get(current_endpoint, api_key);
}
