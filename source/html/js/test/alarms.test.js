/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import { jest } from '@jest/globals';
import * as alarms from "../app/alarms.js";

afterEach(() => {
    jest.restoreAllMocks();
});

test('get_subscribers_with_alarms', () => {
    expect(alarms.get_subscribers_with_alarms()).toMatchObject({
        current: [],
        previous: [],
    }
    )
});

test('add_callback', () => {
    let testing_exports = alarms.exported_for_unit_tests;
    let caller = jest.fn();
    alarms.add_callback(caller);
    expect(testing_exports.listeners).toContain(caller);
});

test('all_alarms_for_region', () => {
    let testing_exports = alarms.exported_for_unit_tests;
    let caller = jest.fn();
    alarms.add_callback(caller);
    expect(testing_exports.listeners).toContain(caller);
});
