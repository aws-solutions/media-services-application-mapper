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
            .get(
                url +
                    "/cached/mediapackage-channel-mediapackage-origin-endpoint",
                api_key
            )
            .then((results) => {
                for (let connection of results) {
                    const data = JSON.parse(connection.data);
                    items.push({
                        id: connection.arn,
                        to: connection.to,
                        from: connection.from,
                        data: data,
                        label: data.package,
                        arrows: "to",
                        color: {
                            color: "black",
                        },
                        smooth: {
                            enabled: true,
                            type: "discrete",
                        },
                    });
                }
                resolve(items);
            });
    });
};

export const module_name = "MediaPackage Channel to Endpoint Connections";
