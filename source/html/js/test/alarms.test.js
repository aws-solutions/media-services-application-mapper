/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

/* eslint no-import-assign: "off" */

import { jest } from '@jest/globals';
import * as alarms from "../app/alarms.js";
import * as server from "../app/server.js";
import * as connections from "../app/connections.js";

const internals = alarms.exported_for_unit_tests;

afterEach(() => {
    jest.restoreAllMocks();
});

test('get_subscribers_with_alarms', () => {
    expect(alarms.get_subscribers_with_alarms()).toMatchObject({
        current: [],
        previous: [],
    }
    );
});

test('add_callback', () => {
    const caller = jest.fn();
    alarms.add_callback(caller);
    expect(internals.listeners).toContain(caller);
});

test('all_alarms_for_region', () => {
    connections.get_current = jest.fn(() => {
        return ["url", "api-key"];
    });
    server.get = jest.fn(() => {
        return Promise.resolve(true);
    });
    expect(alarms.all_alarms_for_region("us-west-2")).resolves.toBeTruthy();
});

test('subscribe_to_alarm', () => {
    connections.get_current = jest.fn(() => {
        return ["url", "api-key"];
    });
    server.post = jest.fn(() => {
        return Promise.resolve(true);
    });
    expect(alarms.subscribe_to_alarm("us-west-2", "TEST-ALARM", ["ARN-1", "ARN-2"])).resolves.toBeTruthy();
});

test('unsubscribe_to_alarm', () => {
    connections.get_current = jest.fn(() => {
        return ["url", "api-key"];
    });
    server.post = jest.fn(() => {
        return Promise.resolve(true);
    });
    expect(alarms.unsubscribe_from_alarm("us-west-2", "TEST-ALARM", ["ARN-1", "ARN-2"])).resolves.toBeTruthy();
});

test('alarms_for_subscriber', () => {
    connections.get_current = jest.fn(() => {
        return ["url", "api-key"];
    });
    server.get = jest.fn(() => {
        return Promise.resolve(true);
    });
    expect(alarms.alarms_for_subscriber("ARN-1")).resolves.toBeTruthy();
});

test('delete_all_subscribers', () => {
    connections.get_current = jest.fn(() => {
        return ["url", "api-key"];
    });
    server.delete_method = jest.fn(() => {
        return Promise.resolve(true);
    });
    expect(alarms.delete_all_subscribers()).resolves.toBeTruthy();
});

// set_update_interval
// get_update_interval
