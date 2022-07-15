/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import { jest } from '@jest/globals'

/* eslint no-import-assign: "off" */
import * as server from "../app/server.js";
import * as api_check from "../app/api_check.js";

afterEach(() => {
    jest.restoreAllMocks();
  });

test('ping', () => {
    // mock the server.get module function
    server.get = jest.fn(() => { return "success" });
    expect(api_check.ping('fake-url', 'fake-api-key')).toBe("success");
});
