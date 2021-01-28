**[🚀 Solution Landing Page](https://aws.amazon.com/solutions/implementations/media-services-application-mapper/)** | **[🚧 Feature request](https://github.com/awslabs/aws-media-services-application-mapper/issues/new?assignees=&labels=feature-request%2C+enhancement&template=feature_request.md&title=)** | **[🐛 Bug Report](https://github.com/awslabs/aws-media-services-application-mapper/issues/new?assignees=&labels=bug%2C+triage&template=bug_report.md&title=)**

Note: If you want to use the solution without building from source, navigate to Solution Landing Page

## Table of contents

- [Solution Overview](#solution-overview)
- [Architecture Diagram](#architecture-diagram)
- [AWS CDK Constructs](#aws-solutions-constructs)
- [Customizing the Solution](#customizing-the-solution)
  - [Prerequisites for Customization](#prerequisites-for-customization)
  - [Build](#build)
  - [Unit Test](#unit-test)
  - [Deploy](#deploy)
- [File Structure](#file-structure)
- [License](#license)

<a name="solution-overview"></a>
# Solution Overview
[//]: # (What does the solution do? What customer problem does it solve? Mention specific use cases)
* AWS Media Services Application Mapper (MSAM) is a browser-based tool that allows operators to visualize the structure and logical connections among AWS Media Services and supporting services in the cloud.
* MSAM can be used as a top-down resource monitoring tool when integrated with CloudWatch.
* MSAM offers two different visualization options: Diagrams and Tiles. 
* MSAM can be configured to automatically display AWS Media Services alerts from AWS Elemental MediaLive channels and multiplex and AWS Elemental MediaConnect.

Go [here](docs/FEATURES.md) for more information on MSAM's capabilities and features.

<a name="architecture-diagram"></a>
# Architecture Diagram
[//]: # (Provide Architecture Diagram. Add few bullets to describe the architecture workflow)
You'll find the various architectural views for MSAM [here](docs/ARCHITECTURE.md).
<a name="aws-solutions-constructs"></a><a name="customizing-the-solution"></a>
# Customizing the Solution

<a name="prerequisites-for-customization"></a>
## Prerequisites for Customization
[//]: # (Add any prerequisites for customization steps. e.g. Prerequisite: Node.js>10)

* Configure the bucket name of your target Amazon S3 distribution bucket
```
export DIST_OUTPUT_BUCKET=my-bucket-name # bucket where customized code will reside
export SOLUTION_NAME=my-solution-name
export VERSION=my-version # version number for the customized code
```
_Note:_ You would have to create an S3 bucket with the prefix '_my-bucket-name-<aws_region>_'.  aws_region is where you are testing the customized solution. Also, the assets in bucket should be publicly accessible.

<a name="build"></a>
## Build
[//]: # (Add commands to build lambda binaries from root of the project)
To build the distributable and prepare the CloudFormation templates:
```
chmod +x ./build-s3-dist.sh \n
./build-s3-dist.sh $DIST_OUTPUT_BUCKET $SOLUTION_NAME $VERSION \n
```

CloudFormation templates will be written to deployment/global-s3-assets.

Lambda binaries will be written to deployment/regional-s3-assets.


<a name="unit-test"></a>
## Unit Test
[//]: # (Add commands to run unit tests from root of the project)

<a name="deploy"></a>
## Deploy
[//]: # (Add commands to deploy the solution's stacks from the root of the project)

* Deploy the distributable to an Amazon S3 bucket in your account. _Note:_ you must have the AWS Command Line Interface installed. 
From the deployment directory run the _deploy.sh_ script. 

Script usage:
```
./deploy.sh [-b BucketBasename] [-s SolutionName] [-v VersionString] [-r RegionsForDeploy] [-p AWSProfile] [-a ACLSettings(public-read|none)] [-t DeployType(dev|release)] 
```

Example usage:
```
 ./deploy.sh -b mybucket -s aws-media-services-application-mapper -v v1.8.0 -r "us-west-2 us-east-1 us-east-2" -p default -a public-read -t dev


```

All CloudFormation templates and lambda binaries will end up in:

``` 
s3://my-bucket-aws-region/solution-name/version/
```

If deploying with type _release_, CloudFormation templates will also be written to:
``` 
s3://my-bucket-aws-region/solution-name/latest/
```

* Get the link of the solution template uploaded to your Amazon S3 bucket.

``` 
s3://my-bucket-aws-region/solution-name/latest/aws-media-services-application-mapper.template

OR

s3://my-bucket-aws-region/solution-name/version/aws-media-services-application-mapper-timestamp.template
```

* Deploy the solution to your account by launching a new AWS CloudFormation stack using the link of the solution template in Amazon S3.

<a name="file-structure"></a>
# File structure

AWS Media Services Application Mapper consists of:

- CDK constructs to generate necessary resources
- Microservices used in the solution

[//]: # (Sample File Structure)

<pre>
|-deployment/
  |cwsa.yaml/                     [ CDK generated template for solution deployment]
|-source/
  |-resources
    |-bin/
      |-app.ts                    [ entry point for CDK app ]
    |-__tests__/                  [ unit tests for CDK constructs ] 
    |-lib/
      |-fms.ts                    [ CDK construct for FMS stack and related resources ]
      |-iam.ts                    [ CDK construct for iam resources]
      |-master.ts                 [ CDK construct for FMS stack and related resources ]
    |-config_files                [ tsconfig, jest.config.js, package.json etc. ]
  |-services/
    |-common/                     [ generic libraries used across solution ]
      |-logger/                   [ logger libary ]
      |-metrics/                  [ metrics libary ]
    |-helper/                     [ lambda backed helper custom resource to help with solution launch/update/delete ]
    |-policyManager/              [ microservice to manage FMS security policies ]
      |-__tests/                  [ unit tests for all policy managers ]   
      |-lib/
        |-clientConfig.json       [ config for AWS service clients ]
        |-manifest.json           [ manifest file for FMS policy configurations ]
        |-wafManager.ts           [ class for WAF policy CRUD operations]
        |-shieldManager.ts        [ class for Shield policy CRUD operations]
        |-securitygroupManager.ts [ class for Security Group policy CRUD operations]
        |-fmsHelper.ts            [ helper functions for FMS policy]
        |-policyManager.ts        [ entry point to process FMS policies]
      |-index.ts                  [ entry point for lambda function]     
      |-config_files              [ tsconfig, jest.config.js, package.json etc. ]
    |-preReqManager
      |-__tests/                  [ unit tests for pre req manager ] 
      |-lib/ 
        |-clientConfig.json       [ config for AWS service clients ]
        |-preReqManager.ts        [ class for FMS pre-requisites validaion and installation ]
      |-index.ts                  [ entry point for lambda function]     
      |-config_files              [ tsconfig, jest.config.js, package.json etc. ]     
  |-config_files                  [ eslint, prettier, tsconfig, jest.config.js, package.json etc. ]  
</pre>

<a name="license"></a>
# License

See license [here](https://github.com/awslabs/aws-media-services-application-mapper/blob/master/LICENSE).
