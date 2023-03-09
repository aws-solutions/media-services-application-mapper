/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    Aws,
    aws_events as events,
    aws_events_targets as events_targets,
    aws_iam as iam,
    aws_lambda as lambda,
    aws_s3 as s3,
    CfnMapping,
    CfnMappingProps,
    Duration,
    Fn,
    NestedStack,
    NestedStackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as utils from './utils';

interface MsamEventsProps extends NestedStackProps {
    /**
     * This is the DynamoDB region where the MSAM events table is located (us-east-1, us-west-2, eu-west-1).
     */
    readonly EventsTableRegion: string;

    /**
     * This is the DynamoDB table name that collects MediaLive alert events for MSAM.
     */
    readonly EventsTableName: string;

    /**
     * The number of seconds before a record in the MSAM events table automatically expires and is removed (3600 = 1 hour, 86400 = 1 day, 604800 = 1 week).
     */
    readonly ItemTTL: string;

    /**
     * This is the DynamoDB table name that stores cached content for MSAM.
     */
    readonly ContentTableName: string;

    /**
     * This is the DynamoDB table name that collects all CloudWatch events for MSAM.
     */
    readonly CloudWatchEventsTableName: string;

    /**
     * This is the DynamoDB table name that stores alarms for MSAM nodes.
     */
    readonly AlarmsTableName: string;

    /**
     * This is the IAM Role ARN for the Events Lambda functions.
     */
    readonly EventsIAMRole: iam.Role;   
}

export class MsamEvents extends NestedStack {
    constructor(scope: Construct, id: string, props: MsamEventsProps) {
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
            role: props.EventsIAMRole,
            environment: {
                BUILD_STAMP: 'DEV_0_0_0',
                EVENTS_TABLE_REGION: props.EventsTableRegion,
                EVENTS_TABLE_NAME: props.EventsTableName,
                CONTENT_TABLE_NAME: props.ContentTableName,
                CLOUDWATCH_EVENTS_TABLE_NAME: props.CloudWatchEventsTableName,
                ITEM_TTL: props.ItemTTL,
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
            role: props.EventsIAMRole,
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
                EVENTS_TABLE_REGION: props.EventsTableRegion,
                ALARMS_TABLE_NAME: props.AlarmsTableName,
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
}
