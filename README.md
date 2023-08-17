**[🚀 Solution Landing Page](https://aws.amazon.com/solutions/implementations/media-services-application-mapper/)** | **[🚧 Feature request](https://github.com/awslabs/aws-media-services-application-mapper/issues/new?assignees=&labels=feature-request%2C+enhancement&template=feature_request.md&title=)** | **[🐛 Bug Report](https://github.com/awslabs/aws-media-services-application-mapper/issues/new?assignees=&labels=bug%2C+triage&template=bug_report.md&title=)**

Note: If you want to use the solution without building from source, navigate to Solution Landing Page

## Table of contents

- [Solution Overview](#solution-overview)
- [Installation Guide](#installation-guide)
- [Architecture Diagram](#architecture-diagram)
- [Customizing the Solution](#customizing-the-solution)
  - [Prerequisites for Customization](#prerequisites-for-customization)
  - [Build](#build)
  - [Unit Test](#unit-test)
  - [Deploy](#deploy)
- [File structure](#file-structure)
- [License](#license)
- [Collection of operational metrics](#collection-of-operational-metrics)
  - [Navigate](#navigate)

<a name="solution-overview"></a>
# Solution Overview
[//]: # (What does the solution do? What customer problem does it solve? Mention specific use cases)
* AWS Media Services Application Mapper (MSAM) is a browser-based tool that allows operators to visualize the structure and logical connections among AWS Media Services and supporting services in the cloud.
* MSAM can be used as a top-down resource monitoring tool when integrated with CloudWatch.
* MSAM offers two different visualization options: Diagrams and Tiles. 
* MSAM can be configured to automatically display AWS Media Services alerts from AWS Elemental MediaLive channels and multiplex and AWS Elemental MediaConnect.

**Go [here](https://docs.aws.amazon.com/solutions/latest/media-services-application-mapper/welcome.html) for more information on MSAM's capabilities and features.**

<a name="installation"></a>
# Installation Guide
Go [here](https://docs.aws.amazon.com/solutions/latest/media-services-application-mapper/automated-deployment.html) for more information on installing MSAM into your AWS account.

<a name="architecture-diagram"></a>
# Architecture Diagram
[//]: # (Provide Architecture Diagram. Add few bullets to describe the architecture workflow)
You'll find the various architectural views for MSAM [here](https://docs.aws.amazon.com/solutions/latest/media-services-application-mapper/architecture-overview.html).
<a name="aws-solutions-constructs"></a><a name="customizing-the-solution"></a>
# Customizing the Solution

<a name="prerequisites-for-customization"></a>
## Prerequisites for Customization
[//]: # (Add any prerequisites for customization steps. e.g. Prerequisite: Node.js>10)

* Install/update to Python 3.x
* Install the AWS Command Line Interface (CLI)
* Create a Python [virtual environment](https://docs.python.org/3.8/library/venv.html) using [requirements.txt](deployment/requirements.txt) and activate it
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
cd deployment
chmod +x ./build-s3-dist.sh
./build-s3-dist.sh $DIST_OUTPUT_BUCKET $SOLUTION_NAME $VERSION
```

CloudFormation templates will be written to deployment/global-s3-assets.

Lambda binaries will be written to deployment/regional-s3-assets.


<a name="unit-test"></a>
## Unit Test
[//]: # (Add commands to run unit tests from root of the project)
Execute this solution's unit tests manually with the following commands:
```
cd deployment
chmod +x run-unit-tests.sh
./run-unit-tests.sh
```

If no virtual environment is currently activate, this script will create and activate a temporary Python virtual environment capable of running the unit tests.


<a name="deploy"></a>
## Deploy
[//]: # (Add commands to deploy the solution's stacks from the root of the project)

Deploy the distributable to an Amazon S3 bucket in your account. 

1. From the deployment directory run the _deploy.sh_ script. 

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

2.  Get the link of the solution template uploaded to your Amazon S3 bucket.

``` 
s3://my-bucket-aws-region/solution-name/latest/aws-media-services-application-mapper-release.template

OR

s3://my-bucket-aws-region/solution-name/version/aws-media-services-application-mapper-timestamp.template
```

3. Deploy the solution to your account by launching a new AWS CloudFormation stack using the link of the solution template in Amazon S3.

<a name="file-structure"></a>
# File structure

AWS Media Services Application Mapper consists of:

<pre>
|- deployment
|   |- build-s3-dist.sh             [ Script for building distributables and preparing the CloudFormation templates ]
|   |- deploy.sh                    [ Script for deploying distributables and CloudFormation templates to user's S3 bucket ]
|   |- global-s3-assets             [ CloudFormation templates get written here during custom build ]
|   |- regional-s3-assets           [ Packaged code for Lambda get written here during custom build ]
|   |- run-unit-test.sh             [ Script for running unit tests ]
|- docs
|   |- ARCHITECTURE.md              [ 4+1 architectural views of MSAM ]
|   |- DEV_PROCESS.md               [ Describes the MSAM team's development process and environment ]
|   |- EXTENDING_MSAM.md            [ Instructions to extend MSAM with your own types ]
|   |- FEATURES.md                  [ Overview of solution features ]
|   |- INSTALL.md                   [ Installation guide for MSAM ]
|   |- MANAGED_INSTANCES.md         [ Using AWS Systems Manager and on-premise hardware ]
|   |- MEDIALIVE_WORKFLOW_WIZARD.md [ Monitoring worfklow created by MediaLive workflow wizard ]
|   |- RESOURCE_TAGS.md             [ Tagging resources for tile and diagram creation ]
|   |- REST_API.md                  [ Overview of the MSAM REST API and use ]
|   |- UNINSTALL.md                 [ Steps to remove MSAM from your AWS account ]
|   |- USAGE.md                     [ Getting started and usage tips for the browser tool ]
|   |- WORKSHOP.md                  [ Steps for a workshop presented at re:Invent 2019 ]
|   |- behavioral-views.drawio      [ diagrams.net source for behavioral view ]
|   |- deployment-view.drawio       [ diagrams.net source for deployment view ]
|   |- images                       [ Images used in documentation ]
|   |- logical-view.drawio          [ diagrams.net source for logical view ]
|   |- physical-view.drawio         [ diagrams.net source for physical view ]
|   |- use-cases.drawio             [ diagrams.net source for use case view ]
|- source
    |- events                       [ Source files for CloudWatch Event and Alarm handling ]
    |- html                         [ Source files for browser application ]
    |- msam                         [ Source files for the MSAM REST API and scheduled tasks ]
    |- tools                        [ Scripts used in the development of MSAM ]
    |- web-cloudformation           [ Source files for the web template and custom resources ]
</pre>

<a name="license"></a>
# License

See license [here](LICENSE.txt).


<a name="metrics"></a>
# Collection of operational metrics

This solution collects anonymized operational metrics to help AWS improve the quality of features of the solution. For more information about this capability, please see the [implementation guide](https://docs.aws.amazon.com/solutions/latest/media-services-application-mapper-on-aws/references.html).

## Navigate
Navigate to [Architecture](https://docs.aws.amazon.com/solutions/latest/media-services-application-mapper/architecture-overview.html) | [Workshop](docs/WORKSHOP.md) | [Install](https://docs.aws.amazon.com/solutions/latest/media-services-application-mapper/automated-deployment.html) | [Usage](https://docs.aws.amazon.com/solutions/latest/media-services-application-mapper/using-the-browser-application.html) | [Uninstall](https://docs.aws.amazon.com/solutions/latest/media-services-application-mapper/uninstall-the-solution.html) | [Rest API](docs/REST_API.md) | [Contributing](CONTRIBUTING.md)