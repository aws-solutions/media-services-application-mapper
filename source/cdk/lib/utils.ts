/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    CfnResource,
    CfnOutput,
    CfnOutputProps,
    CfnStack,
    IResource,
    Stack,
} from 'aws-cdk-lib';
import { Construct, IConstruct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';


export interface NagSuppressRule {
    readonly id: string;
    readonly id2?: string;
    readonly reason: string;
}

/**
 * Creates a metadata property on resource to suppress cfn_nag and/or cdk_nag rules.
 * 
 * @param IResource resource
 * @param NagSuppressRule[] rules
 */
export function setNagSuppressRules(resource: IResource | CfnResource, ...rules: NagSuppressRule[]): void {
    const cfn_rules: NagSuppressRule[] = rules.filter((rule) => isCfnNagId(rule.id) || isCfnNagId(rule.id2)).map(
        (rule) => {
            return {
                id: isCfnNagId(rule.id) ? rule.id : rule.id2!,
                reason: rule.reason,
            }
        }
    );
    const cdk_rules: NagSuppressRule[] = rules.filter((rule) => isCdkNagId(rule.id) || isCdkNagId(rule.id2)).map(
        (rule) => {
            return {
                id: isCdkNagId(rule.id) ? rule.id : rule.id2!,
                reason: rule.reason,
            }
        }
    );

    if (cfn_rules.length != 0) {
        setCfnNagSuppressRules(resource, cfn_rules);
    }

    if (cdk_rules.length != 0) {
        setCdkNagSuppressRules(resource, cdk_rules);
    }
}

/**
 * Returns true if the id looks like a CDK nag id.
 * 
 * @param string|undefined id
 * 
 * @returns boolean
 */
function isCdkNagId(id: string | undefined): boolean {
    return (id || '').startsWith('AwsSolutions-');
}

/**
 * Returns true if the id is not empty and doesn't look like a CDK nag id.
 * 
 * @param string|undefined id
 * 
 * @returns boolean
 */
function isCfnNagId(id: string | undefined): boolean {
    return !isCdkNagId(id) && (id || '').length !== 0;
}

/**
 * Creates a metadata property on resource to suppress cfn_nag rules.
 * 
 * @param IResource | CfnResource resource
 * @param NagSuppressRule[] rules
 */
function setCfnNagSuppressRules(resource: IResource | CfnResource, rules: NagSuppressRule[]): void {
    // We need the underlying CfnResource so get it if we have a IResource.
    const cfn: CfnResource = resource instanceof CfnResource ? resource : resource.node.defaultChild as CfnResource;
    // Add metadata representing the rules to suppress.
    cfn.cfnOptions.metadata = Object.assign({
        cfn_nag: {
            rules_to_suppress: rules,
        },
    }, cfn.cfnOptions.metadata);
}

/**
 * Creates a metadata property on resource to suppress cdk_nag rules.
 * 
 * @param IConstruct | IConstruct[] resource
 * @param NagSuppressRule[] rules
 */
function setCdkNagSuppressRules(resource: IConstruct | IConstruct[], rules: NagSuppressRule[]): void {
    NagSuppressions.addResourceSuppressions(resource, rules, true);
}

/**
 * 
 * CFN Output wrapper
 * 
 * @param Construct scope 
 * @param string id 
 * @param CfnOutputProps props 
 * @returns CfnOutput 
 */
export const createCfnOutput = (scope: Construct, id: string, props: CfnOutputProps): CfnOutput => {
    return new CfnOutput(scope, id, props);
}

/**
 * Cleans up the logical ID by removing excessive customizations made by CDK.
 * 
 * @param string logicalId 
 * @returns string
 */
export const cleanUpLogicalId = (logicalId: string): string => {
    return logicalId
        .replace(/NestedStack.*NestedStackResource/, '')
        .replace(/[A-F0-9]{8}([A-Z][a-z][a-z])?$/, (_, m1) => (m1 || '').replace(/^Ref$/, ''));
}

/**
 * Replace the default Template URL with the specified url value
 * 
 * @param nestedStack 
 * @param templateUrl 
 */
export const addTemplateUrl = (nestedStack: Stack, templateUrl: string): void => {
    (nestedStack.node.defaultChild as CfnStack).templateUrl = templateUrl;
};
