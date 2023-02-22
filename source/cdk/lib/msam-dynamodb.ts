/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    aws_dynamodb as dynamodb,
    aws_lambda as lambda,
    aws_iam as iam,
    aws_s3 as s3,
    Aws,
    CfnElement,
    CfnParameter,
    CustomResource,
    CustomResourceProps,
    Duration,
    Fn,
    NestedStack,
    NestedStackProps,
    RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as utils from './utils';

export class MsamDynamoDB extends NestedStack {
    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(
            scope,
            id,
            {
                ...props,
                description: 'Media Services Application Mapper DynamoDB Tables %%VERSION%%',
            }
        );

        /**
         * CFN Parameters
         */
        const dynamoDBIAMRoleARN = new CfnParameter(this, 'DynamoDBIAMRoleARN', {
            description: 'This is the IAM Role ARN for the DynamoDB Lambda functions.',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,
            constraintDescription: 'Please enter a value for this field.'
        });

        /**
         * Lambda Functions
         */
        const defaultSettingsResourceFunction = new lambda.Function(this, 'DefaultSettingsResource', {
            code: lambda.Code.fromBucket(
                s3.Bucket.fromBucketName(
                    this,
                    'DistributionBucket',
                    Fn.join('-', ['%%BUCKET_NAME%%', Aws.REGION]),
                ),
                '%%SOLUTION_NAME%%/%%VERSION%%/dynamodb_resource_DEV_0_0_0.zip',
            ),
            handler: 'lambda_function.lambda_handler',
            description: 'MSAM Lambda for adding defaults to the Settings table',
            memorySize: 2560,
            environment: {
                BUILD_STAMP: 'DEV_0_0_0',
                SOLUTION_ID: 'AwsSolution/SO0048/%%VERSION%%',
            },
            role: iam.Role.fromRoleArn(this, 'DynamoDBIAMRole', dynamoDBIAMRoleARN.valueAsString),
            runtime: lambda.Runtime.PYTHON_3_8,
            timeout: Duration.seconds(300),
        });
        utils.setNagSuppressRules(defaultSettingsResourceFunction,
            {
                id: 'W58',
                reason: 'Role with CloudWatch Logs permissions defined in different template.',
            },
            {
                id: 'W92',
                reason: 'Lambda does not need ReservedConcurrentExecutions.',
            },
            {
                id: 'W89',
                reason: 'Lambda does not need to be in a VPC.',
            },
            {
                id: 'AwsSolutions-L1',
                reason: 'Latest runtime version not supported at this time.',
            },
        );

        /**
         * DynamoDB Tables
         */

        // Channels DynamoDB Table
        const channelsTable = this.createDynamoDB('Channels', {
            partitionKey: {
                name: 'channel',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            },
        });

        // Events DynamoDB Table
        const eventsTable = this.createDynamoDB('Events', {
            partitionKey: {
                name: 'resource_arn',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'alarm_id',
                type: dynamodb.AttributeType.STRING,
            },
            timeToLiveAttribute: 'expires',
        });
        eventsTable.addGlobalSecondaryIndex({
            indexName: 'AlarmStateIndex',
            partitionKey: {
                name: 'alarm_state',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        eventsTable.addGlobalSecondaryIndex({
            indexName: 'ResourceAlarmStateIndex',
            partitionKey: {
                name:'resource_arn',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'alarm_state',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        eventsTable.addGlobalSecondaryIndex({
            indexName: 'AlarmStateSourceIndex',
            partitionKey: {
                name:'source',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'alarm_state',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Layout DynamoDB Table
        const layoutTable = this.createDynamoDB('Layout', {
            partitionKey: {
                name:'view',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            },
        });
        layoutTable.addGlobalSecondaryIndex({
            indexName: 'IdIndex',
            partitionKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Settings DynamoDB Table
        const settingsTable = this.createDynamoDB('Settings', {
            partitionKey: {
                name:'id',
                type: dynamodb.AttributeType.STRING,
            },
        });

        // Content DynamoDB Table
        const contentTable = this.createDynamoDB('Content', {
            partitionKey: {
                name:'arn',
                type: dynamodb.AttributeType.STRING,
            },
            timeToLiveAttribute: 'expires',
        });
        contentTable.addGlobalSecondaryIndex({
            indexName: 'ServiceRegionIndex',
            partitionKey: {
                name: 'service',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name:'region',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Alarms DynamoDB Table
        const alarmTable = this.createDynamoDB('Alarms', {
            partitionKey: {
                name:'RegionAlarmName',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'ResourceArn',
                type: dynamodb.AttributeType.STRING,
            },
        });
        alarmTable.addGlobalSecondaryIndex({
            indexName: 'StateValueIndex',
            partitionKey: {
                name: 'StateValue',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        alarmTable.addGlobalSecondaryIndex({
            indexName: 'RegionAlarmNameIndex',
            partitionKey: {
                name: 'RegionAlarmName',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        alarmTable.addGlobalSecondaryIndex({
            indexName: 'ResourceArnIndex',
            partitionKey: {
                name: 'ResourceArn',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // CloudWatchEvents DynamoDB Table
        const cloudWatchEventsTable = this.createDynamoDB('CloudWatchEvents', {
            partitionKey: {
                name: 'resource_arn',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.NUMBER,
            },
            timeToLiveAttribute: 'expires',
        });

        // ResourceNotes DynamoDB Table
        const resourceNotesTable = this.createDynamoDB('ResourceNotes', {
            partitionKey: {
                name:'resource_arn',
                type: dynamodb.AttributeType.STRING,
            },
        });

        /**
         * Custom Resources
         */

        // DefaultSettings CustomResource
        this.createCustomResource('DefaultSettings', {
            serviceToken: defaultSettingsResourceFunction.functionArn,
            properties: {
                SettingsTable: settingsTable.tableName,
                BUILD_STAMP: 'DEV_0_0_0',
                StackName: Aws.STACK_NAME,
            },
        });
        
        /**
         * CfnOutputs
         */
        utils.createCfnOutput(this, 'AlarmsTable', {
            description: 'Alarms table resource name',
            value: alarmTable.tableName,
        });

        utils.createCfnOutput(this, 'ChannelsTable', {
            description: 'Channels table resource name',
            value: channelsTable.tableName,
        });

        utils.createCfnOutput(this, 'ContentTable', {
            description: 'Content table resource name',
            value: contentTable.tableName,
        });

        utils.createCfnOutput(this, 'EventsTable', {
            description: 'Events table resource name',
            value: eventsTable.tableName,
        });

        utils.createCfnOutput(this, 'LayoutTable', {
            description: 'Layout table resource name',
            value: layoutTable.tableName,
        });

        utils.createCfnOutput(this, 'SettingsTable', {
            description: 'Settings table resource name',
            value: settingsTable.tableName,
        });

        utils.createCfnOutput(this, 'CloudWatchEventsTable', {
            description: 'CloudWatchEvents table resource name',
            value: cloudWatchEventsTable.tableName,
        });

        utils.createCfnOutput(this, 'NotesTable', {
            description: 'Notes table resource name',
            value: resourceNotesTable.tableName,
        });
    }

    createDynamoDB(id: string, props: dynamodb.TableProps): dynamodb.Table {
        return new dynamodb.Table(this, id, {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            removalPolicy: RemovalPolicy.DESTROY,
            ...props,
        });
    }

    createCustomResource(id: string, props: CustomResourceProps): CustomResource{
        return new CustomResource(this, id, props);
    }

    getLogicalId(element: CfnElement): string {
        return utils.cleanUpLogicalId(super.getLogicalId(element));
    }
}
