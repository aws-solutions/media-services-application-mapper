# Media Services Application Mapper (MSAM)

This workshop guides the user through basic understanding of MSAM including installation, configuration, tuning, and resource monitoring.


## Workshop Agenda (re:Invent 2018)

* Overview of Media Services Application Mapper
* Install MSAM into your AWS account using CloudFormation
* MSAM browser application
	* Content cache tuning
	* First run!
	* Review navigation, diagram layout, searching
	* Tiles
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
* Be aware of the Input Parameters and Output subsections for each template

**After installing the DynamoDB stack (Template 1), you can install the remaining stacks (Templates 2, 3, and 4) concurrently. There is no need to wait for each to finish before starting the next.**

* Use the same region where your Media Services workflow is running
* Retrieve the API key for browser access

Navigate to the [Install](INSTALL.md) document and follow the instructions to install all four MSAM CloudFormation templates into your AWS account.

## Part 3: Browser Application

### Essential Diagram and Tile Usage

1. Navigate to the [Usage](USAGE.md) document
2. Read and follow the First Run instructions
3. Practice navigation, layout, and search
4. Create one or more tiles

## Part 4: CloudWatch Alarms and Event Integration

MSAM integrates with CloudWatch alarms and MediaLive pipeline alerts, and can visually indicate alarm or alert conditions on diagram nodes.

2. Navigate to the [Usage](USAGE.md) document
3. Review and configure CloudWatch alert and alarm subscriptions
4. Learn about MediaLive pipeline alerts

### Create a pipeline alert

Pause one of your pipelines to trigger a pipeline alert on your MediaLive channel. 
1. Navigate to the MediaLive console.
1. Click on your channel.  
1. From the **Schedule** tab, click on **Create** button.
1. Provide an action name like `Pause`.
1. Leave the Start Type as **Fixed**.
1. Provide a UTC time that’s at least 15 seconds from current UTC time.  You can look up current UTC time by going to sites like: https://time.is/UTC
1. From **Action Type** dropdown, select **Pause**.
1. Click on **Add Pipelines** button. 
1. From **Pipelines Id** dropdown, select **PIPELINE_0**.
1. Click on **Create** button.
1. Find the MediaLive Channel in MSAM.
1. Wait for the pipeline alert to show on the MediaLive node. The alert show up once the pause event gets triggered at the scheduled time.
1. Select the channel and click the monitor tab to view the alert.
1. Repeat steps 1-10 above when ready to un-pause the pipeline. This should clear the alert.


## Removal and Clean Up

When you are finished using MSAM and will no longer need it, proceed to the [Uninstall](UNINSTALL.md) document and follow the instructions.

## Navigate

Navigate to [README](README.md) | [Workshop](WORKSHOP.md) | [Install](INSTALL.md) | [Usage](USAGE.md) | [Uninstall](UNINSTALL.md)
