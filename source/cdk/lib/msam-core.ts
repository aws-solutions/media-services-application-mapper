/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    cloudformation_include as cfnInc,
    CfnElement,
    NestedStack,
    NestedStackProps,
} from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as utils from './utils';

export class MsamCore extends NestedStack {
    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(
            scope,
            id,
            {
                ...props,
            }
        );

        // Core Module Stack
        this.initStackFromTemplate('CoreModuleStack', '../dist/msam-core-release.template');
    }

    initStackFromTemplate(id: string, relativePath: string) {
        return new cfnInc.CfnInclude(this, id, {
            templateFile: path.join(__dirname, relativePath),
        });
    }

    getLogicalId(element: CfnElement): string {
        return utils.cleanUpLogicalId(super.getLogicalId(element));
    }
}
