/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    Aws,
    aws_apigateway as apiGateway,
    aws_iam as iam,
    aws_ssm as ssm,
    aws_sam as sam,
    cloudformation_include as cfnInc,
    NestedStack,
    NestedStackProps,
} from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as utils from './utils';

interface MsamCoreProps extends NestedStackProps {
    readonly CoreIAMRole: iam.Role;
    readonly AlarmsTableName: string;
    readonly ChannelsTableName: string;
    readonly ContentTableName: string;
    readonly EventsTableName: string;
    readonly LayoutTableName: string;
    readonly SettingsTableName: string;
    readonly CloudWatchEventsTableName: string;
    readonly NotesTableName: string;
    readonly CacheItemTTL: string;
    readonly RootStackName: string;
};

export class MsamCore extends NestedStack {
    /**
     * API Key Id
     */
    readonly APIKeyID: string;
    /**
     * Endpoint URL
     */
    readonly EndpointURL: string;
    /**
     * API Handler ARN
     */
    readonly APIHandlerArn: string;
    /**
     * API Handler Name
     */
    readonly APIHandlerName: string;
    /**
     * Rest API Id
     */
    readonly RestAPIId: string;


    constructor(scope: Construct, id: string, props: MsamCoreProps) {
        super(
            scope,
            id,
            {
                ...props,
                description: 'Media Services Application Mapper REST API and Tasks %%VERSION%%',
            }
        );

        // Core Module Stack
        const coreStack = this.initStackFromTemplate('CoreModuleStack', '../dist/msam-core-release.template');

        /**
         * Resources
         */

        // IncomingCloudwatchAlarm
        const incomingCloudWatchAlarm = coreStack.getResource('IncomingCloudwatchAlarm') as sam.CfnFunction;
        incomingCloudWatchAlarm.environment = {
            variables: {
                ...(incomingCloudWatchAlarm.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
            },
        };
        incomingCloudWatchAlarm.description = 'MSAM Lambda for handling CloudWatch alarm notifications';
        this.applyCommonLambdaProperties(incomingCloudWatchAlarm, props.CoreIAMRole);
        
        // DeleteAllResourceNotes
        const deleteAllResourceNotes = coreStack.getResource('DeleteAllResourceNotes') as sam.CfnFunction;
        deleteAllResourceNotes.environment = {
            variables: {
                ...(deleteAllResourceNotes.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                NOTES_TABLE_NAME: props.NotesTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                STACKNAME: props.RootStackName,
            },
        };
        deleteAllResourceNotes.description = 'MSAM Lambda for handling deletion of all resource notes';
        this.applyCommonLambdaProperties(deleteAllResourceNotes, props.CoreIAMRole);

        // UpdateNodes
        const updateNodes = coreStack.getResource('UpdateNodes') as sam.CfnFunction;
        updateNodes.environment = {
            variables: {
                ...(updateNodes.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
            },
        };
        updateNodes.description = 'MSAM Lambda for periodically updating the node cache';
        this.applyCommonLambdaProperties(updateNodes, props.CoreIAMRole);

        // UpdateConnections
        const updateConnections = coreStack.getResource('UpdateConnections') as sam.CfnFunction;
        updateConnections.environment = {
            variables: {
                ...(updateConnections.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
            },
        };
        updateConnections.description = 'MSAM Lambda for periodically updating the connection cache';
        this.applyCommonLambdaProperties(updateConnections, props.CoreIAMRole);

        // UpdateFromTags
        const updateFromTags = coreStack.getResource('UpdateFromTags') as sam.CfnFunction;
        updateFromTags.environment = {
            variables: {
                ...(updateFromTags.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
            },
        };
        updateFromTags.description = 'MSAM Lambda for handling diagram and tile updates from tags';
        this.applyCommonLambdaProperties(updateFromTags, props.CoreIAMRole);

        // SsmRunCommand
        const ssmRunCommand = coreStack.getResource('SsmRunCommand') as sam.CfnFunction;
        ssmRunCommand.environment = {
            variables: {
                ...(ssmRunCommand.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
            },
        };
        ssmRunCommand.description = 'MSAM Lambda for running all applicable commands for a given managed instance';
        this.applyCommonLambdaProperties(ssmRunCommand, props.CoreIAMRole);

        // ProcessSsmRunCommand
        const processSsmRunCommand = coreStack.getResource('ProcessSsmRunCommand') as sam.CfnFunction;
        processSsmRunCommand.environment = {
            variables: {
                ...(processSsmRunCommand.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
            },
        };
        processSsmRunCommand.description = 'MSAM Lambda for processing outputs from running a command on a managed instance';
        this.applyCommonLambdaProperties(processSsmRunCommand, props.CoreIAMRole);

        // UpdateSsmNodes
        const updateSsmNodes = coreStack.getResource('UpdateSsmNodes') as sam.CfnFunction;
        updateSsmNodes.environment = {
            variables: {
                ...(updateSsmNodes.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
            },
        };
        updateSsmNodes.description = 'MSAM Lambda for periodically updating the managed instances node cache';
        this.applyCommonLambdaProperties(updateSsmNodes, props.CoreIAMRole);

        // GenerateMetrics
        const generateMetrics = coreStack.getResource('GenerateMetrics') as sam.CfnFunction;
        generateMetrics.environment = {
            variables: {
                ...(generateMetrics.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
                STACKNAME: props.RootStackName,
            },
        };
        generateMetrics.description = 'MSAM Lambda for periodically emitting metrics to multiple targets';
        this.applyCommonLambdaProperties(generateMetrics, props.CoreIAMRole);

        // ReportMetrics
        const reportMetrics = coreStack.getResource('ReportMetrics') as sam.CfnFunction;
        reportMetrics.environment = {
            variables: {
                ...(reportMetrics.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
                STACKNAME: props.RootStackName,
            },
        };
        reportMetrics.description = 'MSAM Lambda for periodically emitting metrics to multiple targets';
        this.applyCommonLambdaProperties(reportMetrics, props.CoreIAMRole);

        // APIHandler
        const apiHandler = coreStack.getResource('APIHandler') as sam.CfnFunction;
        apiHandler.environment = {
            variables: {
                ...(apiHandler.environment as sam.CfnFunction.FunctionEnvironmentProperty).variables,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
                CACHE_ITEM_TTL: props.CacheItemTTL,
                CHANNELS_TABLE_NAME: props.ChannelsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                EVENTS_TABLE_NAME: props.EventsTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
                LAYOUT_TABLE_NAME: props.LayoutTableName,
                NOTES_TABLE_NAME: props.NotesTableName,
                SETTINGS_TABLE_NAME: props.SettingsTableName,
                DELETE_NOTES_FUNCTION: deleteAllResourceNotes.ref,
            }
        };
        apiHandler.description = 'MSAM Lambda for handling API requests';
        this.applyCommonLambdaProperties(apiHandler, props.CoreIAMRole);
        this.APIHandlerArn = apiHandler.getAtt('Arn').toString();
        this.APIHandlerName = apiHandler.functionName || '';

        /**
         * SSM Documents
         */

        // MSAMElementalLiveCompletedEvents
        this.createSsmCfnDocument('MSAMElementalLiveCompletedEvents', {
            content: {
                schemaVersion: '1.2',
                description: 'How many Elemental Live events have completed?',
                runtimeConfig: {
                    'aws:runShellScript': {
                        properties: [
                            {
                                id: '0.aws:runShellScript',
                                runCommand: [
                                'curl -H "Accept: application/xml" http://localhost/api/live_events?filter=complete'
                                ],
                            },
                        ],
                    },
                },
            },
            tags: [
                {
                    key: 'MSAM-NodeType',
                    value: 'ElementalLive'
                }
            ]
        });

        // MSAMElementalLiveErroredEvents
        this.createSsmCfnDocument('MSAMElementalLiveErroredEvents', {
            content: {
                schemaVersion: '1.2',
                description: 'How many Elemental Live events have errored?',
                runtimeConfig: {
                    'aws:runShellScript': {
                        properties: [
                            {
                                id: '0.aws:runShellScript',
                                runCommand: [
                                    'curl -H \"Accept: application/xml\" http://localhost/api/live_events?filter=error',
                                ]
                            }
                        ]
                    }
                }
            },
            tags: [
                {
                    key: 'MSAM-NodeType',
                    value: 'ElementalLive'
                }
            ]
        });

        // MSAMElementalLiveRunningEvents
        this.createSsmCfnDocument('MSAMElementalLiveRunningEvents', {
            content: {
                schemaVersion: '1.2',
                description: 'How many Elemental Live events have been running?',
                runtimeConfig: {
                    'aws:runShellScript': {
                        properties: [
                            {
                                id: '0.aws:runShellScript',
                                runCommand: [
                                    'curl -H \"Accept: application/xml\" http://localhost/api/live_events?filter=running',
                                ]
                            }
                        ]
                    }
                }
            },
            tags: [
                {
                    key: 'MSAM-NodeType',
                    value: 'ElementalLive'
                }
            ]
        });

        // MSAMElementalLiveStatus
        this.createSsmCfnDocument('MSAMElementalLiveStatus', {
            content: {
                schemaVersion: '1.2',
                description: 'Is the Elemental Live process running?',
                runtimeConfig: {
                    'aws:runShellScript': {
                        properties: [
                            {
                                id: '0.aws:runShellScript',
                                runCommand: [
                                    'sudo /etc/init.d/elemental_se status || sudo systemctl status elemental_se',
                                ]
                            }
                        ]
                    }
                }
            },
            tags: [
                {
                    key: 'MSAM-NodeType',
                    value: 'ElementalLive'
                }
            ]
        });

        // MSAMElementalLiveActiveAlerts
        this.createSsmCfnDocument('MSAMElementalLiveActiveAlerts', {
            content: {
                schemaVersion: '1.2',
                description: 'How many alerts are currently active on the encoder?',
                runtimeConfig: {
                    'aws:runShellScript': {
                        properties: [
                            {
                                id: '0.aws:runShellScript',
                                runCommand: [
                                    'curl http://localhost/api/alerts.xml?filter=Active',
                                ]
                            }
                        ]
                    }
                }
            },
            tags: [
                {
                    key: 'MSAM-NodeType',
                    value: 'ElementalLive'
                }
            ]
        });

        // MSAMSsmSystemStatus
        this.createSsmCfnDocument('MSAMSsmSystemStatus', {
            content: {
                schemaVersion: '1.2',
                description: 'Is this instance reachable?',
                runtimeConfig: {
                    'aws:runShellScript': {
                        properties: [
                            {
                                id: '0.aws:runShellScript',
                                runCommand: [
                                    'date',
                                ]
                            }
                        ]
                    }
                }
            },
            tags: [
                {
                    key: 'MSAM-NodeType',
                    value: 'SsmSystem'
                }
            ]
        });

        /**
         * API Gateway UsagePlan and API Keys
         */

        // Rest API
        const restApi = coreStack.getResource('RestAPI') as sam.CfnApi;
        this.EndpointURL = `https://${restApi.ref}.execute-api.${Aws.REGION}.${Aws.URL_SUFFIX}/msam/`
        this.RestAPIId = restApi.ref;

        // API Key
        const apiKey = new apiGateway.ApiKey(this, 'APIKey', {
            description: 'MSAM default API key',
            enabled: true,
        });
        this.APIKeyID = `https://${Aws.REGION}.console.aws.amazon.com/apigateway/home?region=${Aws.REGION}#/api-keys/${apiKey.keyId}`;

        // Usage Plan
        const usagePlan = new apiGateway.UsagePlan(this, 'UsagePlan', {
            description: 'MSAM default usage plan',
            name: 'MSAM Usage Plan',
        });

        // UsagePlanKeyAssociation
        this.createCfnUsagePlanKey('UsagePlanKeyAssociation', {
            keyId: apiKey.keyId,
            keyType: 'API_KEY',
            usagePlanId: usagePlan.usagePlanId,
        });
    }

    initStackFromTemplate(id: string, relativePath: string) {
        return new cfnInc.CfnInclude(this, id, {
            templateFile: path.join(__dirname, relativePath),
        });
    }

    applyCommonLambdaProperties(lambda: sam.CfnFunction, coreIAMRole: iam.Role): void {
        // apply s3 source code
        lambda.codeUri = {
            bucket: `%%BUCKET_NAME%%-${Aws.REGION}`,
            key: '%%SOLUTION_NAME%%/%%VERSION%%/core_DEV_0_0_0.zip',
        };
        // apply role
        lambda.role = coreIAMRole.roleArn;
        // apply cfn nags
        utils.setNagSuppressRules(lambda,
            {
                id: 'W58',
                reason: 'Role with CloudWatch Logs permissions defined in different template.',
            },
            {
                id: 'W89',
                reason: 'Lambda does not need to be in a VPC.',
            },
            {
                id: 'W92',
                reason: 'Lambda does not need ReservedConcurrentExecutions.',
            },
        );
    }

    createSsmCfnDocument(id: string, props: ssm.CfnDocumentProps) {
        return new ssm.CfnDocument(this, id, props);
    }

    createCfnUsagePlanKey(id: string, props: apiGateway.CfnUsagePlanKeyProps) {
        return new apiGateway.CfnUsagePlanKey(this, id, props);
    }
}
