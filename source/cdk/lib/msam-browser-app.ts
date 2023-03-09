/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    Aws,
    aws_cloudfront as cloudfront,
    aws_iam as iam,
    aws_lambda as lambda,
    aws_s3 as s3,
    CustomResource,
    CustomResourceProps,
    Duration,
    Fn,
    NestedStack,
    NestedStackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as utils from './utils';

interface MsamBrowserAppProps extends NestedStackProps {
    /**
     * This is the IAM Role ARN for the Web app Lambda functions.
     */
    readonly WebIAMRole: iam.Role;
}

export class MsamBrowserApp extends NestedStack {
    /**
     * URL for the MSAM browser application via CloudFront
     */
    readonly MSAMBrowserURL: string;

    /**
     * MSAM browser application bucket
     */
    readonly MSAMBrowserAppBucket: string;

    constructor(scope: Construct, id: string, props: MsamBrowserAppProps) {
        super(
            scope,
            id,
            {
                ...props,
                description: 'Media Services Application Mapper Browser Application %%VERSION%%',
            }
        );

        /**
         * Resources
         */

        // Browser App Logging S3 Bucket
        const s3BucketbrowserAppLogs = new s3.Bucket(this, 'MSAMBrowserAppLoggingBucket', {
            accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
            encryption: s3.BucketEncryption.S3_MANAGED,
            lifecycleRules: [
                {
                    abortIncompleteMultipartUploadAfter: Duration.days(5),
                    expiration: Duration.days(365),
                    id: 'Expire Objects After 1 Year',
                    noncurrentVersionExpiration: Duration.days(365),
                }
            ],
        });
        utils.setNagSuppressRules(s3BucketbrowserAppLogs, 
            {
                id: 'W35',
                id2: 'AwsSolutions-S1',
                reason: 'This is the logging bucket. No access logging needed.'
            },
            {
                id: 'W51',
                reason: 'This is the logging bucket.  No bucket policy needed.'
            },
            {
                id: 'AwsSolutions-S2',
                reason: 'Public access blocked by default'
            },
            {
                id: 'AwsSolutions-S10',
                reason: 'HTTPS requirement not supported at this time.',
            }
        );

        // Browser App S3 Bucket
        const s3BucketBrowserApp = new s3.Bucket(this, 'MSAMBrowserAppBucket', {
            cors: [
                {
                    allowedHeaders: ['*'],
                    allowedMethods: [s3.HttpMethods.GET],
                    allowedOrigins: ['*'],
                }
            ],
            encryption: s3.BucketEncryption.S3_MANAGED,
        });

        this.MSAMBrowserAppBucket = Fn.join('', [
            'https://s3.console.aws.amazon.com/s3/buckets/',
            s3BucketBrowserApp.bucketName,
            '/?region=',
            Aws.REGION,
        ]);

        utils.setNagSuppressRules(s3BucketBrowserApp,
            {
                id: 'AwsSolutions-S2',
                reason: 'Public access blocked by default'
            },
            {
                id: 'W51',
                reason: 'This is the logging bucket. No bucket policy needed.'
            },
            {
                id: 'AwsSolutions-S10',
                reason: 'HTTPS requirement not supported at this time.',
            }
        );

        (s3BucketBrowserApp.node.defaultChild as s3.CfnBucket).loggingConfiguration = {
            destinationBucketName: s3BucketbrowserAppLogs.bucketName,
            logFilePrefix: 'app-bucket/',
        };

        // CloudFront OriginAccessIdentity
        const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'MSAMAppBucketOriginAccessIdentity', {
            comment: Fn.join('', [
                'Origin Access Identity for ',
                s3BucketBrowserApp.bucketName,
            ])
        });

        // Browser App S3 Bucket Policy
        const s3BucketAppPolicy = this.createS3BucketPolicy('MSAMBrowserAppBucketPolicy', {
            bucket: s3BucketBrowserApp.bucketName,
            policyDocument: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        principals: [new iam.CanonicalUserPrincipal(cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
                        actions: ['s3:GetObject'],
                        resources: [
                            Fn.join('', [
                                s3BucketBrowserApp.bucketArn,
                                '/*',
                            ]),
                        ],
                    }),
                ],
            }),
        });

        utils.setNagSuppressRules(s3BucketAppPolicy,
            {
                id: 'AwsSolutions-S10',
                reason: 'HTTPS requirement not supported at this time.',
            }
        )

        // CloudFront Distribution
        /**
         * Distribution L2 construct is available for use
         * The solution, however, requires many cloudfront propeties not supported in L2 construct's native props
         * Thus, the L1 CfnCloudfront is used instead.
         */
        const cloudfrontDistribution = new cloudfront.CfnDistribution(this, 'MSAMAppBucketCloudFrontDistribution', {
            distributionConfig: {
                comment: Fn.join('', [
                    'CDN for ',
                    s3BucketBrowserApp.bucketName,
                ]),
                defaultCacheBehavior: {
                    targetOriginId: s3BucketBrowserApp.bucketName,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
                    minTtl: 3600,
                    defaultTtl: 7200,
                    maxTtl: 86400,
                    allowedMethods: [
                        'HEAD',
                        'GET',
                        'OPTIONS',
                    ],
                    cachedMethods: [
                        'HEAD',
                        'GET',
                        'OPTIONS',
                    ],
                    compress: true,
                    forwardedValues: {
                        queryString: false,
                        cookies: {
                            forward: 'none',
                        },
                        headers: [
                            'Origin',
                            'Access-Control-Request-Method',
                            'Access-Control-Request-Headers',
                        ],
                    },
                },
                defaultRootObject: 'index.html',
                enabled: true,
                origins: [{
                    domainName: s3BucketBrowserApp.bucketRegionalDomainName,
                    id: s3BucketBrowserApp.bucketName,
                    s3OriginConfig: {
                        originAccessIdentity: Fn.join('', [
                            'origin-access-identity/cloudfront/',
                            cloudfrontOriginAccessIdentity.originAccessIdentityId,
                        ]),
                    },
                }],
                priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
                restrictions: {
                    geoRestriction: {
                        restrictionType: 'none',
                        locations: [],
                    },
                },
                viewerCertificate: {
                    cloudFrontDefaultCertificate: true,
                    minimumProtocolVersion: 'TLSv1.2_2019',
                },
                logging: {
                    bucket: s3BucketbrowserAppLogs.bucketRegionalDomainName,
                    prefix: 'cloudfront/',
                },
            }
        });
        this.MSAMBrowserURL = Fn.join('', [
            'https://',
            cloudfrontDistribution.attrDomainName,
        ]);
        utils.setNagSuppressRules(cloudfrontDistribution,
            {
                id: 'W70',
                id2: 'AwsSolutions-CFR4',
                reason: 'If the distribution uses the CloudFront domain name such as d111111abcdef8.cloudfront.net (you set CloudFrontDefaultCertificate to true), CloudFront automatically sets the security policy to TLSv1 regardless of the value that you set here.',
            },
            {
                id: 'AwsSolutions-CFR1',
                reason: 'Geo restriction not supported at this time.',
            },
            {
                id: 'AwsSolutions-CFR2',
                reason: 'AWS WAF integration not supported at this time.',
            }
        );

        // Web Content Lambda Function
        const webContentLambda = new lambda.Function(this, 'MSAMWebContentResource', {
            code: lambda.Code.fromBucket(
                s3.Bucket.fromBucketName(
                    this,
                    'ContentLambdaBucket',
                    Fn.join('-', ['%%BUCKET_NAME%%', Aws.REGION]),
                ),
                '%%SOLUTION_NAME%%/%%VERSION%%/CUSTOM_RESOURCE_FILE',
            ),
            environment: {
                BUILD_STAMP: 'DEV_0_0_0',
                ZIP_DIGEST: 'ZIP_DIGEST_VALUE',
                BUCKET_BASENAME: '%%BUCKET_NAME%%'
            },
            handler: 'cfn_bucket_loader.handler',
            description: 'MSAM Lambda for custom CloudFormation resource for loading web application',
            memorySize: 2560,
            role: props.WebIAMRole,
            runtime: lambda.Runtime.PYTHON_3_8,
            timeout: Duration.seconds(900),
        });
        utils.setNagSuppressRules(webContentLambda,
            {
                id: 'W58',
                reason: 'Role with AWSLambdaBasicExecutionRole defined in different template.'
            },
            {
                id: 'W89',
                reason: 'Lambda does not need to be in a VPC.'
            },
            {
                id: 'W92',
                reason: 'Lambda does not need ReservedConcurrentExecutions.'
            },
            {
                id: 'AwsSolutions-L1',
                reason: 'Latest runtime version not supported at this time.',
            },
        )

        // Web Content Custom Resource
        this.createCustomResource('MSAMWebContent', {
            serviceToken: webContentLambda.functionArn,
            properties: {
                BucketName: s3BucketBrowserApp.bucketName,
                StackName: Aws.STACK_NAME,
                BUILD_STAMP: 'DEV_0_0_0',
                ZIP_DIGEST: 'ZIP_DIGEST_VALUE',
            },
        });

        // Web Invalidation Resource Lambda Function
        const webInvalidationResourceLambda = new lambda.Function(this, 'MSAMWebInvalidationResource', {
            code: lambda.Code.fromBucket(
                s3.Bucket.fromBucketName(
                    this,
                    'InvalidationBucket',
                    Fn.join('-', ['%%BUCKET_NAME%%', Aws.REGION]),
                ),
                '%%SOLUTION_NAME%%/%%VERSION%%/CUSTOM_RESOURCE_FILE',
            ),
            environment: {
                BUILD_STAMP: 'DEV_0_0_0',
                ZIP_DIGEST: 'ZIP_DIGEST_VALUE',
                BUCKET_BASENAME: '%%BUCKET_NAME%%'
            },
            handler: 'cfn_invalidate_resource.handler',
            description: 'MSAM Lambda for custom resource for invalidating CloudFront after update',
            memorySize: 2560,
            role: props.WebIAMRole,
            runtime: lambda.Runtime.PYTHON_3_8,
            timeout: Duration.seconds(300),
        });
        utils.setNagSuppressRules(webInvalidationResourceLambda,
            {
                id: 'W58',
                reason: 'Role with AWSLambdaBasicExecutionRole defined in different template.'
            },
            {
                id: 'W89',
                reason: 'Lambda does not need to be in a VPC.'
            },
            {
                id: 'W92',
                reason: 'Lambda does not need ReservedConcurrentExecutions.'
            },
            {
                id: 'AwsSolutions-L1',
                reason: 'Latest runtime version not supported at this time.',
            },
        );

        // Web Invalidator Custom Resource
        this.createCustomResource('MSAMWebInvalidator', {
            serviceToken: webInvalidationResourceLambda.functionArn,
            properties: {
                BucketName: s3BucketBrowserApp.bucketName,
                StackName: Aws.STACK_NAME,
                BUILD_STAMP: 'DEV_0_0_0',
                ZIP_DIGEST: 'ZIP_DIGEST_VALUE',
                DistributionId: cloudfrontDistribution.attrId,
            },
        });
    }

    createCustomResource(id: string, props: CustomResourceProps) {
        return new CustomResource(this, id, props);
    }

    createS3BucketPolicy(id: string, props: s3.CfnBucketPolicyProps) {
        return new s3.CfnBucketPolicy(this, id, props);
    }
}
