#!/usr/bin/env node
/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import * as cdk from 'aws-cdk-lib';
import { MediaServicesApplicationMapper } from '../lib/media-services-application-mapper';
import { AwsSolutionsChecks } from 'cdk-nag';

const cdkApplication = new cdk.App();

(function createMediaServicesApplicationMapperStack(app) {
    return new MediaServicesApplicationMapper(app, 'MediaServicesApplicationMapper');
})(cdkApplication);

//cdk nag
cdk.Aspects.of(cdkApplication).add(new AwsSolutionsChecks({ verbose: true }));
