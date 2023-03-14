/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    Aws,
    aws_servicecatalogappregistry as appRegistry,
    CfnMapping,
    CfnResource,
    CfnOutput,
    CfnOutputProps,
    CfnStack,
    IResource,
    Fn,
    Stack,
    NestedStack,
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
 * Replace the default Template URL with the specified url value
 * 
 * @param nestedStack 
 * @param templateUrl 
 */
export const addTemplateUrl = (nestedStack: Stack, templateUrl: string): void => {
    (nestedStack.node.defaultChild as CfnStack).templateUrl = templateUrl;
};

/**
 * Nested Stack with stack name interface
 */
export interface NamedNestedStack {
    stackName: string,
    stack: NestedStack,
};

/**
 * Creates AppRegistry Application and Attribute Groups then associate to main and nested stacks
 * 
 * @param Stack main application stack
 * @param NestedStack[] Nested stacks
 */
export function applyAppRegistry(stack: Stack, nestedStacks: NamedNestedStack[]) {
    const map = new CfnMapping(stack, "Solution");
    map.setValue("Data", "ID", "SO0048");
    map.setValue("Data", "Version", "%%VERSION%%");
    map.setValue("Data", "AppRegistryApplicationName", "media-services-application-mapper");
    map.setValue("Data", "SolutionName", "Media Services Application Mapper");
    map.setValue("Data", "ApplicationType", "AWS-Solutions");

    // Main AppRegistry Application
    const application = new appRegistry.CfnApplication(stack, "AppRegistryApplication", {
        name: Fn.join("-", [
            map.findInMap("Data", "AppRegistryApplicationName"),
            Aws.REGION,
            Aws.ACCOUNT_ID,
            Aws.STACK_NAME,
        ]),
        description: `Service Catalog application to track and manage all your resources for the solution Media Services Application Mapper`,
        tags: {
            'Solutions:SolutionID': map.findInMap("Data", "ID"),
            'Solutions:SolutionName': map.findInMap("Data", "SolutionName"),
            'Solutions:SolutionVersion': map.findInMap("Data", "Version"),
            'Solutions:ApplicationType': map.findInMap("Data", "ApplicationType"),
        },
    });

    // Associate Application to Stack
    createCfnResourceAssociation(stack, 'AppRegistryApplicationStackAssociation', {
        application: application.attrId,
        resource: Aws.STACK_ID,
        resourceType: 'CFN_STACK',
    });

    // Associate all nested stacks to main application
    for (const nestedStack of nestedStacks) {
        createCfnResourceAssociation(stack, `AppRegistryApplicationNestedStackAssociation${nestedStack.stackName}`, {
            application: application.attrId,
            resource: nestedStack.stack.stackId,
            resourceType: 'CFN_STACK',
        });
    }

    // Default attribute group for application
    const attributeGroup = new appRegistry.CfnAttributeGroup(
        stack,
        "DefaultApplicationAttributes",
        {
            name: Fn.join("-", [
                Aws.REGION,
                Aws.STACK_NAME 
            ]),
            description: "Attribute group for solution information",
            attributes: {
                applicationType: map.findInMap("Data", "ApplicationType"),
                version: map.findInMap("Data", "Version"),
                solutionID: map.findInMap("Data", "ID"),
                solutionName: map.findInMap("Data", "SolutionName"),
            },
        }
    );

    // Attribute group association
    createCfnAttributeGroupAssociation(stack, 'AppRegistryApplicationAttributeAssociation', {
        application: application.attrId,
        attributeGroup: attributeGroup.attrId,
    });
}

function createCfnResourceAssociation(scope: Construct, id: string, props: appRegistry.CfnResourceAssociationProps) {
    return new appRegistry.CfnResourceAssociation(scope, id, props);
}

function createCfnAttributeGroupAssociation(scope: Construct, id: string, props: appRegistry.CfnAttributeGroupAssociationProps) {
    return new appRegistry.CfnAttributeGroupAssociation(scope, id, props);
}