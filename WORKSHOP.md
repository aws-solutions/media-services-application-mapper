# Media Services Application Mapper (MSAM)

This workshop guides the user through basic understanding of MSAM including installation, configuration, tuning, and resource monitoring.


## Workshop Agenda

* Overview of Media Services Application Mapper
* Install MSAM into your AWS account using CloudFormation
* MSAM browser application
	* Content cache tuning
	* First run!
	* Review navigation, diagram layout, searching
	* Channel tiles
* CloudWatch Integration
	* Understand monitoring, alarms, alerts
	* Create a pipeline alert


## Part 1: Tool Overview

* Learn the two main uses for MSAM (visualization, monitoring)
* Learn how MSAM represents Media resources in the cloud, and how sets of resources are presented
* Learn how resources are monitored with MSAM using CloudWatch

Review [README](README.md)

## Part 2: Install MSAM

* MSAM uses CloudFormation for installation and updates
* Install all four MSAM templates into the same region

**After installing the DynamoDB stack (Template 1), you can install the remaining stacks (Templates 2, 3, and 4) concurrently. There is no need to wait for each to finish before starting the next.**

* Use the same region where your Media Services workflow is running
* Create at least one API key for browser access

Navigate to the [Install](INSTALL.md) document and follow the instructions to install all four MSAM CloudFormation templates into your AWS account.

## Part 3: Browser Application

### Workshop Tuning

Before you start using the browser application. The following instructions will help tune the cache collection in the cloud.

1. Open the application with your browser
2. Connect with endpoint URL and API key
3. Select regions when prompted (only us-west-2)
4. Copy the following list of regions exactly as shown: 
`ap-south-1 eu-west-3 eu-west-2 eu-west-1 ap-northeast-3 ap-northeast-2 ap-northeast-1 sa-east-1 ca-central-1 ap-southeast-1 ap-southeast-2 eu-central-1 us-east-1 us-east-2 us-west-1`
1. Open Settings/Advanced Settings menu in MSAM
1. Paste the list of regions into the Never Cache Regions field
1. Click Save
1. After a few minutes refresh the browser to see any new nodes cached by the API

### Basic Navigation and Usage

2. Navigate to the [Usage](USAGE.md) document
3. Read and follow the First Run instructions
3. Practice navigation, layout, and search
4. Create one or more channel tiles

## Part 4: CloudWatch Alarms and Event Integration

MSAM integrates with CloudWatch alarms and MediaLive pipeline alerts, and can visually indicate alarm or alert conditions on diagram nodes.

2. Navigate to the [Usage](USAGE.md) document
3. Review and configure CloudWatch alert and alarm subscriptions
4. Learn about MediaLive pipeline alerts

### Create a pipeline alert

1. Stop your MediaLive Channel
1. Edit your MediaLive Input
1. Edit one input URL to make it invalid
1. Save the MediaLive Input
1. Start the MediaLive Channel
1. Wait for Channel to start
1. Find the MediaLive Channel in MSAM
1. Wait for the pipeline alert to show on the MediaLive node
1. Select the channel and click the monitor tab to view the alert
1. Done? Go back and fix your input URL


## Removal and Clean Up

When you are finished using MSAM and will no longer need it, proceed to the [Uninstall](UNINSTALL.md) document and follow the instructions.

## Navigate

Navigate to [README](README.md) | [Workshop](WORKSHOP.md) | [Install](INSTALL.md) | [Usage](USAGE.md) | [Uninstall](UNINSTALL.md) | [FAQ](FAQ.md)
