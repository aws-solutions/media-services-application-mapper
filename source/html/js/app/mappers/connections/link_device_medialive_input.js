/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as server from "../../server.js";
import * as connections from "../../connections.js";

export const update = function () {
    const current = connections.get_current();
    const url = current[0];
    const api_key = current[1];
    const items = [];
    return new Promise((resolve) => {
        server
            .get(url + "/cached/link-device-medialive-input", api_key)
            .then((results) => {
                for (const connection of results) {
                    const data = JSON.parse(connection.data);
                    items.push({
                        id: connection.arn,
                        to: connection.to,
                        from: connection.from,
                        label: data.scheme,
                        data: data,
                        arrows: "to",
                        color: {
                            color: "black",
                        },
                    });
                }
                resolve(items);
            });
    });
};

export const module_name = "Elemental Link to MediaLive Input";
