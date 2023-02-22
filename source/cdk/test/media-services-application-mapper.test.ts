/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MediaServicesApplicationMapper } from '../lib/media-services-application-mapper';

test('media-services-application-mapper snapshot test', () => {
    const app = new cdk.App();
    const stack = new MediaServicesApplicationMapper(app, 'MediaServicesApplicationMapper');
    const template = Template.fromStack(stack);

    expect(template).toMatchSnapshot();
});
