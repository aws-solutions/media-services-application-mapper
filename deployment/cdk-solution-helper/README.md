# cdk-solution-helper

A lightweight helper function that cleans-up synthesized templates from the AWS Cloud Development Kit (CDK) and prepares
them for use with the AWS Solutions publishing pipeline. This function performs the following task:

## Template cleanup

Cleans out parameters and metadata created by AWS CDK that help with `cdk deploy`, but aren't used in the
published CloudFormation templates.

***
&copy; Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
