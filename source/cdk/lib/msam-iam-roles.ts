/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    aws_iam as iam,
    CfnElement,
    Fn,
    NestedStack,
    NestedStackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as utils from './utils';

export class MsamIamRoles extends NestedStack {
    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(
            scope,
            id,
            {
                ...props,
                description: 'Media Services Application Mapper IAM Roles %%VERSION%%',
            }
        );

        /**
         * IAM Roles
         */

        // Events Role
        const eventsRole = new iam.Role(this, 'EventsRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                {
                    managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                }
            ],
            inlinePolicies: {
                EventsRolePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            sid: 'VisualEditor0',
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'cloudwatch:DescribeAlarms',
                                'dynamodb:PutItem',
                                'dynamodb:Query',
                                'dynamodb:UpdateItem',
                                'mediapackage:Describe*',
                                'medialive:Describe*'
                            ],
                            resources: ['*'],
                        }),
                    ],
                }),
            }
        });
        utils.setNagSuppressRules(eventsRole, 
            {
                id: 'W11',
                reason: 'Resource ARNs are not known in advance.',
            },
            {
                id: 'AwsSolutions-IAM4',
                reason: 'Resource ARNs are not known in advance.',
            },
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Resource ARNs are not known in advance.',
            },
        );

        // DynamoDB Role
        const dynamoDBRole = new iam.Role(this, 'DynamoDBRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                {
                    managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                }
            ],
            inlinePolicies: {
                DynamoDBRolePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            sid: 'VisualEditor0',
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'dynamodb:PutItem',
                                'dynamodb:GetItem',
                                'ec2:DescribeRegions',
                            ],
                            resources: ['*'],
                        }),
                    ],
                }),
            },
        });
        utils.setNagSuppressRules(dynamoDBRole,
            {
                id: 'W11',
                reason: 'Resource ARNs are not known in advance.',
            },
            {
                id: 'AwsSolutions-IAM4',
                reason: 'Resource ARNs are not known in advance.',
            },
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Resource ARNs are not known in advance.',
            },
        );

        // Core Role
        const coreRole = new iam.Role(this, 'CoreRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                CoreRolePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'acm:ListCertificates',
                                'application-autoscaling:DescribeScalableTargets',
                                'application-autoscaling:DescribeScalingActivities',
                                'application-autoscaling:DescribeScalingPolicies',
                                'cloudfront:Get*',
                                'cloudfront:List*',
                                'cloudwatch:Describe*',
                                'cloudwatch:DescribeAlarmHistory',
                                'cloudwatch:DescribeAlarms',
                                'cloudwatch:DescribeAlarmsForMetric',
                                'cloudwatch:GetMetricStatistics',
                                'cloudwatch:GetMetricStatistics',
                                'cloudwatch:ListMetrics',
                                'cloudwatch:ListMetrics',
                                'cloudwatch:PutMetricData',
                                'dynamodb:DeleteItem',
                                'dynamodb:GetItem',
                                'dynamodb:PutItem',
                                'dynamodb:Query',
                                'dynamodb:Scan',
                                'ec2:DescribeSecurityGroups',
                                'ec2:DescribeSubnets',
                                'ec2:DescribeVpcs',
                                'iam:GetRole',
                                'iam:ListRoles',
                                'iam:ListServerCertificates',
                                'lambda:Get*',
                                'lambda:List*',
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:GetLogEvents',
                                'logs:PutLogEvents',
                                'route53:List*',
                                's3:Get*',
                                's3:List*',
                                'sns:ListSubscriptions',
                                'sns:ListSubscriptionsByTopic',
                                'sns:ListTopics',
                                'waf:GetWebACL',
                                'waf:ListWebACLs',
                                'ec2:Describe*',
                                'lambda:InvokeFunction',
                                'mediaconnect:Describe*',
                                'mediaconnect:List*',
                                'medialive:Describe*',
                                'medialive:List*',
                                'mediapackage:Describe*',
                                'mediapackage:List*',
                                'mediastore:Get*',
                                'mediastore:List*',
                                'mediatailor:Get*',
                                'mediatailor:List*',
                                'ssm:Get*',
                                'ssm:List*',
                                'ssm:SendCommand',
                            ],
                            resources: ['*'],
                        }),
                    ],
                }),
            }
        });
        utils.setNagSuppressRules(coreRole,
            {
                id: 'W11',
                reason: 'This role is used by a scanner requiring access to all resources within these services.',
            }, {
                id: 'W76',
                reason: 'This role is used by a scanner requiring access to all resources within these services.',
            },
            {
                id: 'AwsSolutions-IAM5',
                reason: 'This role is used by a scanner requiring access to all resources within these services.',
            },
        );

        // Web Role
        const webRole = new iam.Role(this, 'WebRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                {
                    managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
                },
            ],
            inlinePolicies: {
                WebRolePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            sid: 'VisualEditor0',
                            effect: iam.Effect.ALLOW,
                            actions: [
                                's3:PutObject',
                                's3:ListBucket',
                                's3:DeleteObject',
                                's3:PutObjectAcl',
                                'cloudfront:CreateInvalidation',
                            ],
                            resources: ['*'],
                        }),
                    ],
                }),
            },
        });
        utils.setNagSuppressRules(webRole,
            {
                id: 'W11',
                reason: 'Resource ARNs are not known in advance.',
            },
            {
                id: 'AwsSolutions-IAM4',
                reason: 'Resource ARNs are not known in advance.',
            },
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Resource ARNs are not known in advance.',
            },
        );

        /**
         * Policies
         */

        // Installation Group
        const installationGroup = new iam.Group(this, 'InstallationGroup', {});

        // Installation Policy
        const installationPolicy = new iam.Policy(this, 'InstallationPolicy', {
            policyName: 'MSAM-Installation-Policy',
            document: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            'apigateway:*',
                            'cloudformation:*',
                            'cloudfront:*',
                            'cloudwatch:*',
                            'dynamodb:*',
                            'events:*',
                            'iam:*',
                            'lambda:*',
                            's3:*',
                            'sns:*',
                            'ssm:*',
                        ],
                        resources: ['*'],
                    }),
                ]
            }),
            groups: [installationGroup],
        });

        utils.setNagSuppressRules(installationPolicy, 
            {
                id: 'W12',
                id2: 'AwsSolutions-IAM5',
                reason: 'Resource ARNs are not known in advance.'
            },
            {
                id: 'F39',
                reason: 'Resource ARNs are not known in advance.'
            },
            {
                id: 'F4',
                reason: 'This policy is used by compartmentalized teams to install the solution.'
            },
            {
                id: 'F4',
                reason: 'This policy is used by compartmentalized teams to install the solution.'
            },
        );

        // Installation Managed Policy
        const installationManagedPolicy = new iam.ManagedPolicy(this, 'InstallationManagedPolicyDefinition', {
            document: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            'apigateway:*',
                            'cloudformation:*',
                            'cloudfront:*',
                            'cloudwatch:*',
                            'dynamodb:*',
                            'events:*',
                            'lambda:*',
                            's3:*',
                            'sns:*',
                            'ssm:*'
                        ],
                        resources: ['*'],
                    }),
                ],
            }),
        });
        utils.setNagSuppressRules(installationManagedPolicy,
            {
                id: 'W13',
                id2: 'AwsSolutions-IAM5',
                reason: 'Resource ARNs are not known in advance.'
            },
            {
                id: 'F5',
                reason: 'This policy is used by compartmentalized teams to install the solution.'
            },
            {
                id: 'F39',
                reason: 'This policy is used by compartmentalized teams to install the solution.'
            }
        );

        /**
         * Outputs
         */

        // Installation Managed Policy Output
        utils.createCfnOutput(this, 'InstallationManagedPolicy', {
            value: installationManagedPolicy.managedPolicyArn,
        });

        // Installation Group Link Output
        utils.createCfnOutput(this, 'InstallationGroupLink', {
            description: 'Link to IAM to view and assign users to the installation group',
            value: Fn.join('', [
                'https://console.aws.amazon.com/iam/home?#/groups/',
                installationGroup.groupName,
            ]),
        });

        // Event Role ARN
        utils.createCfnOutput(this, 'EventsRoleARN', {
            description: 'IAM Role ARN for the Events module Lambda functions',
            value: eventsRole.roleArn,
        });

        // DynamoDB Role ARN
        utils.createCfnOutput(this, 'DynamoDBRoleARN', {
            description: 'IAM Role ARN for the DynamoDB module Lambda functions',
            value: dynamoDBRole.roleArn,
        });

        // Core Role ARN
        utils.createCfnOutput(this, 'CoreRoleARN', {
            description: 'IAM Role ARN for the Core module Lambda functions',
            value: coreRole.roleArn,
        });

        // Web Role ARN
        utils.createCfnOutput(this, 'WebRoleARN', {
            description: 'IAM Role ARN for the Web app module Lambda functions',
            value: webRole.roleArn,
        });
    }

    getLogicalId(element: CfnElement): string {
        return utils.cleanUpLogicalId(super.getLogicalId(element));
    }
}
