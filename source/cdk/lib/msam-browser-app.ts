/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

import {
    Aws,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
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
            objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    abortIncompleteMultipartUploadAfter: Duration.days(5),
                    expiration: Duration.days(365),
                    id: 'Expire Objects After 1 Year',
                    noncurrentVersionExpiration: Duration.days(365),
                }
            ],
        });

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
            enforceSSL: true,
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            serverAccessLogsBucket: s3BucketbrowserAppLogs,
            serverAccessLogsPrefix: 'app-bucket/',
        });

        this.MSAMBrowserAppBucket = Fn.join('', [
            'https://s3.console.aws.amazon.com/s3/buckets/',
            s3BucketBrowserApp.bucketName,
            '/?region=',
            Aws.REGION,
        ]);

        // CloudFront Distribution
        const cloudfrontDistribution = new cloudfront.Distribution(this, 'MSAMAppBucketCloudFrontDistribution', {
            enabled: true,
            defaultBehavior: {
                origin: new origins.S3Origin(s3BucketBrowserApp),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
                cachePolicy: new cloudfront.CachePolicy(this, 'MSAMAppBucketCloudFrontCachePolicy', {
                    minTtl: Duration.seconds(3600),
                    defaultTtl: Duration.seconds(7200),
                    maxTtl: Duration.seconds(86400),
                    headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
                        'Origin',
                        'Access-Control-Request-Method',
                        'Access-Control-Request-Headers',
                    ),
                    queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                compress: true,
            },
            comment: Fn.join('', [
                'CDN for ',
                s3BucketBrowserApp.bucketName,
            ]),
            defaultRootObject: 'index.html',
            priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
            enableLogging: true,
            logBucket: s3BucketbrowserAppLogs,
            logFilePrefix: 'cloudfront/',
        });

        this.MSAMBrowserURL = Fn.join('', [
            'https://',
            cloudfrontDistribution.domainName,
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
            runtime: lambda.Runtime.PYTHON_3_10,
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
            runtime: lambda.Runtime.PYTHON_3_10,
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
        );

        // Web Invalidator Custom Resource
        this.createCustomResource('MSAMWebInvalidator', {
            serviceToken: webInvalidationResourceLambda.functionArn,
            properties: {
                BucketName: s3BucketBrowserApp.bucketName,
                StackName: Aws.STACK_NAME,
                BUILD_STAMP: 'DEV_0_0_0',
                ZIP_DIGEST: 'ZIP_DIGEST_VALUE',
                DistributionId: cloudfrontDistribution.distributionId,
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
