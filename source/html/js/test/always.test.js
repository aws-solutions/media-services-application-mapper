/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// two simple checks of the testing framework

test('always passes', () => {
    expect(true).toBe(true);
});

test('always passes', () => {
    expect("Test").toMatch("Test");
});
