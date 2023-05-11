/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import { jest } from '@jest/globals';
import * as connections from "../app/connections.js";

const mock_cookies = {
    "MSAM_CURRENT": "MSAM_ENDPOINT_TEST",
    "MSAM_ENDPOINT_TEST": window.btoa(JSON.stringify({ name: "connection" }))
};

const mock_connections = {
    "MSAM_ENDPOINT_TEST": { name: "connection" }
};

// mock the Cookies global to return test cookies
Cookies.get = jest.fn();
Cookies.set = jest.fn();

afterEach(() => {
    jest.restoreAllMocks();
});

test('get_remembered', () => {
    Cookies.get.mockReturnValue(mock_cookies)
    expect(connections.get_remembered()).toMatchObject([mock_connections["MSAM_ENDPOINT_TEST"]]);
});

test('get_current', () => {
    Cookies.get.mockReturnValueOnce(mock_cookies["MSAM_CURRENT"]);
    Cookies.get.mockReturnValueOnce(mock_cookies["MSAM_ENDPOINT_TEST"]);
    expect(connections.get_current()).toMatchObject(mock_connections["MSAM_ENDPOINT_TEST"]);
});
