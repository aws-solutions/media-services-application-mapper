/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    Aws,
    aws_events as events,
    aws_events_targets as events_targets,
    aws_iam as iam,
    aws_lambda as lambda,
    aws_s3 as s3,
    CfnElement,
    CfnMapping,
    CfnMappingProps,
    CfnParameter,
    Duration,
    Fn,
    NestedStack,
    NestedStackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as utils from './utils';

export class MsamEvents extends NestedStack {
    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(
            scope,
            id,
            {
                ...props,
                description: 'Media Services Application Mapper Event Capture %%VERSION%%',
            }
        );

        /**
         * Cfn Mapping
         */
        this.addMapping('SolutionId', {
            mapping: {
                UserAgent: {
                    Extra: 'AwsSolution/SO0048/%%VERSION%%',
                },
            },
        });

        /**
         * Parameters
         */

        // Events Table Region parameter
        const eventsTableRegion = new CfnParameter(this, 'EventsTableRegion', {
            description: 'This is the DynamoDB region where the MSAM events table is located (us-east-1, us-west-2, eu-west-1).',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,            
            constraintDescription: 'Please enter a value for this field.',
        });

        // Events Table Name parameter
        const eventsTableName = new CfnParameter(this, 'EventsTableName', {
            description: 'This is the DynamoDB table name that collects MediaLive alert events for MSAM.',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,
            constraintDescription: 'Please enter a value for this field.',
        });

        // Item TTL parameter
        const itemTTL = new CfnParameter(this, 'ItemTTL', {
            description: 'The number of seconds before a record in the MSAM events table automatically expires and is removed (3600 = 1 hour, 86400 = 1 day, 604800 = 1 week).',
            default: '604800',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,
            constraintDescription: 'Please enter a value for this field.',
        });

        // Content Table Name parameter
        const contentTableName = new CfnParameter(this, 'ContentTableName', {
            description: 'This is the DynamoDB table name that stores cached content for MSAM.',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,
            constraintDescription: 'Please enter a value for this field.',
        });

        // CloudWatch Events Table Name parameter
        const CloudWatchEventsTableName = new CfnParameter(this, 'CloudWatchEventsTableName', {
            description: 'This is the DynamoDB table name that collects all CloudWatch events for MSAM.',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,
            constraintDescription: 'Please enter a value for this field.',
        });

        // Alarms Table Name parameter
        const alarmsTableName = new CfnParameter(this, 'AlarmsTableName', {
            description: 'This is the DynamoDB table name that stores alarms for MSAM nodes.',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,
            constraintDescription: 'Please enter a value for this field.',
        });

        // Events IAM Role ARN parameter
        const eventsIAMRoleArn = new CfnParameter(this, 'EventsIAMRoleARN', {
            description: 'This is the IAM Role ARN for the Events Lambda functions.',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,
            constraintDescription: 'Please enter a value for this field.',
        });

        /**
         * Lambda Functions
         */

        // Collector Lambda Function
        const collectorLambda = new lambda.Function(this, 'Collector', {
            handler: 'media_events.lambda_handler',
            description: 'MSAM Lambda for handling CloudWatch event notifications',
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromBucket(
                s3.Bucket.fromBucketName(
                    this,
                    'EventsBucket',
                    Fn.join('-', [ '%%BUCKET_NAME%%', Aws.REGION ])
                ),
                '%%SOLUTION_NAME%%/%%VERSION%%/dynamodb_resource_DEV_0_0_0.zip',
            ),
            memorySize: 2560,
            timeout: Duration.seconds(60),
            role: iam.Role.fromRoleArn(this, 'CollectorLambdaEventsIAMRoleARN', eventsIAMRoleArn.valueAsString),
            environment: {
                BUILD_STAMP: 'DEV_0_0_0',
                EVENTS_TABLE_REGION: eventsTableRegion.valueAsString,
                EVENTS_TABLE_NAME: eventsTableName.valueAsString,
                CONTENT_TABLE_NAME: contentTableName.valueAsString,
                CLOUDWATCH_EVENTS_TABLE_NAME: CloudWatchEventsTableName.valueAsString,
                ITEM_TTL: itemTTL.valueAsString,
                SOLUTION_ID: Fn.findInMap('SolutionId', 'UserAgent', 'Extra'),
            },
        });
        utils.setNagSuppressRules(collectorLambda,
            {
                id: 'W58',
                reason: 'Role with CloudWatch Logs permissions defined in different template.'
            },
            {
                id: 'W92',
                reason: 'Lambda does not need ReservedConcurrentExecutions.'
            },
            {
                id: 'W89',
                reason: 'Lambda does not need to be in a VPC.'
            },
            {
                id: 'AwsSolutions-L1',
                reason: 'Latest runtime version not supported at this time.',
            },
        );

        // Collector Lambda Event Rule
        this.addEventRule('MediaEvents', {
            eventPattern: {
                source: [
                    'aws.medialive',
                    'aws.mediapackage',
                    'aws.mediastore',
                    'aws.mediatailor',
                    'aws.mediaconnect',
                ]
            },
            targets: [
                new events_targets.LambdaFunction(collectorLambda),
            ],
        });


        // Alarm Updater Lambda Function
        const alarmUpdaterLambda = new lambda.Function(this, 'AlarmUpdater', {
            handler: 'cloudwatch_alarm.lambda_handler',
            description: 'MSAM Lambda for handling CloudWatch alarm state change events.',
            runtime: lambda.Runtime.PYTHON_3_8,
            role: iam.Role.fromRoleArn(this, 'AlarmUpdaterLambdaEventsIAMRoleARN', eventsIAMRoleArn.valueAsString),
            code: lambda.Code.fromBucket(
                s3.Bucket.fromBucketName(
                    this,
                    'alarmBucket',
                    Fn.join('-', [ '%%BUCKET_NAME%%', Aws.REGION ])
                ),
                '%%SOLUTION_NAME%%/%%VERSION%%/events_DEV_0_0_0.zip',
            ),
            memorySize: 2560,
            timeout: Duration.seconds(60),
            environment: {
                BUILD_STAMP: 'DEV_0_0_0',
                EVENTS_TABLE_REGION: eventsTableRegion.valueAsString,
                ALARMS_TABLE_NAME: alarmsTableName.valueAsString,
                SOLUTION_ID: Fn.findInMap('SolutionId', 'UserAgent', 'Extra'),
            },
        });
        utils.setNagSuppressRules(alarmUpdaterLambda,
            {
                id: 'W58',
                reason: 'Role with CloudWatch Logs permissions defined in different template.'
            },
            {
                id: 'W92',
                reason: 'Lambda does not need ReservedConcurrentExecutions.'
            },
            {
                id: 'W89',
                reason: 'Lambda does not need to be in a VPC.'
            },
            {
                id: 'AwsSolutions-L1',
                reason: 'Latest runtime version not supported at this time.',
            },
        );

        // Alarm Updater Lambda Event Rule
        this.addEventRule('AlarmUpdaterAlarmChangeStateEvents', {
            eventPattern: {
                source: ['aws.cloudwatch'],
                detailType: ['CloudWatch Alarm State Change'],
            },
            targets: [
                new events_targets.LambdaFunction(alarmUpdaterLambda),
            ],
        });
    }

    addMapping(id: string, props?: CfnMappingProps) {
        return new CfnMapping(this, id, props);
    }

    addEventRule(id: string, props?: events.RuleProps) {
        return new events.Rule(this, id, props);
    }

    getLogicalId(element: CfnElement): string {
        if (element.toString().includes('MediaServicesApplicationMapper/EventsModuleStack/MediaEvents/AllowEventRuleMediaServicesApplicationMapperEventsModuleStackCollector')) {
            /*
                While the objective of this function is to remove the random [A-Z0-9]{8} characters
                generated by CDK when synthesizing, this element is generated with [A-Z0-9]{16}.
                Thus, there is no way to pinpoint this exact element
                other than hard-coding the logical ID.
            */
            return 'MediaEventsPermission';
        } else if (element.toString().includes('MediaServicesApplicationMapper/EventsModuleStack/AlarmUpdaterAlarmChangeStateEvents/AllowEventRuleMediaServicesApplicationMapperEventsModuleStackAlarmUpdater')) {
            // Same as above
            return 'AlarmUpdaterAlarmChangeStateEventsPermission';
        }
        return utils.cleanUpLogicalId(super.getLogicalId(element));
    }
}
