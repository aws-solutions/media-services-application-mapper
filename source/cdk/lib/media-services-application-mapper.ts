/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    Aws,
    Fn,
    Stack,
    StackProps,
    CfnParameter,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MsamDynamoDB } from './msam-dynamodb';
import { MsamIamRoles } from './msam-iam-roles';
import { MsamEvents } from './msam-events';
import { MsamBrowserApp } from './msam-browser-app'
import { MsamCore } from './msam-core';
import * as utils from './utils';

export class MediaServicesApplicationMapper extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(
            scope,
            id,
            {
                ...props,
                description: '(SO0048) Media Services Application Mapper Root Stack %%VERSION%%',
            }
        );

        /**
         * Parameters
         */
        const cacheItemTTL = new CfnParameter(this, 'CacheItemTTL', {
            default: '86400',
            description: 'This is the maximum time in seconds a cached item will remain if never updated (3600 = 1 hour, 86400 = 1 day, 604800 = 1 week).',
            type: 'String',
            allowedPattern: '\\S+',
            minLength: 1,
            constraintDescription: 'Please enter a value for this field.',
        });

        /**
         * Nested Stacks
         */

        // IAM Module Stack
        const iamModuleStack = new MsamIamRoles(this, 'IAMModuleStack');
        utils.addTemplateUrl(
            iamModuleStack,
            Fn.join('', [
                'https://%%BUCKET_NAME%%-',
                Aws.REGION,
                '.s3.',
                Aws.URL_SUFFIX,
                '/%%SOLUTION_NAME%%/%%VERSION%%/msam-iam-roles-release.template',
            ]),
        );

        // DynamoDB Module Stack
        const dynamoDBModuleStack = new MsamDynamoDB(this, 'DynamoDBModuleStack', {
            DynamoDBIAMRole: iamModuleStack.DynamoDBRole,
        });
        utils.addTemplateUrl(
            dynamoDBModuleStack,
            Fn.join('', [
                'https://%%BUCKET_NAME%%-',
                Aws.REGION,
                '.s3.',
                Aws.URL_SUFFIX,
                '/%%SOLUTION_NAME%%/%%VERSION%%/msam-dynamodb-release.template',
            ]),
        );

        // Core Module Stack
        const coreModuleStack = new MsamCore(this, 'CoreModuleStack', {
            CoreIAMRole: iamModuleStack.CoreRole,
            AlarmsTableName: dynamoDBModuleStack.AlarmsTable,
            ChannelsTableName: dynamoDBModuleStack.ChannelsTable,
            ContentTableName: dynamoDBModuleStack.ContentTable,
            EventsTableName: dynamoDBModuleStack.EventsTable,
            LayoutTableName: dynamoDBModuleStack.LayoutTable,
            SettingsTableName: dynamoDBModuleStack.SettingsTable,
            CloudWatchEventsTableName: dynamoDBModuleStack.CloudWatchEventsTable,
            NotesTableName: dynamoDBModuleStack.NotesTable,
            CacheItemTTL: cacheItemTTL.valueAsString,
            RootStackName: Aws.STACK_NAME,
        });
        utils.addTemplateUrl(
            coreModuleStack,
            Fn.join('', [
                'https://%%BUCKET_NAME%%-',
                Aws.REGION,
                '.s3.',
                Aws.URL_SUFFIX,
                '/%%SOLUTION_NAME%%/%%VERSION%%/msam-core-release.template',
            ]),
        );

        // Events Module Stack
        const eventsModuleStack = new MsamEvents(this, 'EventsModuleStack', {
            AlarmsTableName: dynamoDBModuleStack.AlarmsTable,
            EventsTableName: dynamoDBModuleStack.EventsTable,
            ContentTableName: dynamoDBModuleStack.ContentTable,
            CloudWatchEventsTableName: dynamoDBModuleStack.CloudWatchEventsTable,
            ItemTTL: cacheItemTTL.valueAsString,
            EventsTableRegion: Aws.REGION,
            EventsIAMRole: iamModuleStack.EventsRole,
        });
        utils.addTemplateUrl(
            eventsModuleStack,
            Fn.join('', [
                'https://%%BUCKET_NAME%%-',
                Aws.REGION,
                '.s3.',
                Aws.URL_SUFFIX,
                '/%%SOLUTION_NAME%%/%%VERSION%%/msam-events-release.template',
            ])
        );

        // Browser App Module Stack
        const browserAppModuleStack = new MsamBrowserApp(this, 'BrowserAppModuleStack', {
            WebIAMRole: iamModuleStack.WebRole,
        });
        utils.addTemplateUrl(
            browserAppModuleStack,
            Fn.join('', [
                'https://%%BUCKET_NAME%%-',
                Aws.REGION,
                '.s3.',
                Aws.URL_SUFFIX,
                '/%%SOLUTION_NAME%%/%%VERSION%%/msam-browser-app-release.template',
            ]),
        );

        /**
         * Outputs
         */
        utils.createCfnOutput(this, 'MSAMBrowserURL', {
            description: 'URL for the MSAM browser application',
            value: browserAppModuleStack.MSAMBrowserURL,
        });

        utils.createCfnOutput(this, 'EndpointURL', {
            description: 'The endpoint needed by the MSAM browser application',
            value: coreModuleStack.EndpointURL,
        });

        utils.createCfnOutput(this, 'APIKeyID', {
            description: 'Link for retrieving API key needed by the MSAM browser application',
            value: coreModuleStack.APIKeyID,
        });
    }
}
