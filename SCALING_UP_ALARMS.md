# Scaling-Up CloudWatch Alarms

## Overview

This guide shows how to configure a large number of CloudWatch alarms for monitoring within MSAM. The existing alarm monitoring mechanism within MSAM is based on a polling model, which has limits in efficiency and scale. The solution described in this guide will become the primary method for configuring alarms and many of the steps described in this guide will be replaced with tool automation to simplify the process in the future.

The high-level process for configuring alarms using this method is:

1. Install or update MSAM using the CloudFormation templates
2. Disable the periodic alarm update schedule in CloudWatch Rules
3. Create one or more SNS topics in AWS regions
4. Add a trigger from the SNS topic(s) to the MSAM IncomingCloudwatchAlarm Lambda
2. Set up your tiles and diagrams in the MSAM inventory as needed
3. Create your alarms from CloudWatch metrics with OK and Alarm state notifications
4. Add an entry for each resource/alarm association in the Alarms DynamoDB table
5. Set an alarm refresh period on the browser application


## Install MSAM

Choose a region to install MSAM. The tool will be able to work with all regions regardless of the region in which it was installed. Follow the [Install](INSTALL.md) guide for new or updating existing installations.

## Disable Alarm Polling Schedule

1. Choose the region in which MSAM was installed from the AWS Console
2. Find the entry in CloudWatch Rules containing the name `UpdateAlarmsUpdateAlarmsEvent`
2. Select the rule and choose Actions/Disable
3. CloudWatch will no longer poll subscribed alarms for updates

## Create an SNS Topic for Alarm Notifications

### Option 1

1. Choose the region in which MSAM was installed from the AWS Console
1. Navigate to the SNS console
2. Create a new SNS Topic (such as `msam-alarm-notify`)
3. Navigate to the Lambda console
4. Find the Lambda with `IncomingCloudwatchAlarm` in the name
5. Add a trigger for this Lambda from the SNS topic created above

### Option 2

1. Navgate to each region CloudWatch alarms are configured
2. Create an SNS topic in each region (such as `msam-alarm-notify-us-west-2`, `msam-alarm-notify-eu-west-1`)
3. Navigate to the Lambda console
4. Find the Lambda with `IncomingCloudwatchAlarm` in the name
5. Add a trigger for this Lambda from each SNS topic created above

## Create Tiles and Diagrams with MSAM

Follow instructions in the various guides on using MSAM. [README](README.md), [Workshop](WORKSHOP.md), and [Usage](USAGE.md) documents provide guidance on how to create tiles and diagrams.

## Create Alarms for Metrics in Monitored Regions

1. Create an alarm from a metric
2. Add an OK state notification and provide the ARN of the SNS topic depending on the option used above for SNS
3. Add an Alarm state notification and provide the ARN of the SNS topic depending on the option used above for SNS
4. Save the alarm
5. If you have many alarms, you might consider using scripting or another automated method to add the OK and Alarm notification to each alarm

## Add Alarm and Resource Associations to MSAM

1. Find the Alarms table in DynamoDB in the same region MSAM is installed
2. Add a record for each alarm and resource association to the table

Two attributes are required for each record in the table:

```
{
    "RegionAlarmName": "eu-west-1:FastAlarmResponse",
    "ResourceArn": "arn:aws:ssm-managed-instance:us-west-2::mi-0ab848a2e77e452f3"
}
```

`RegionAlarmName` is a concatination of the alarm's region name, a colon, and the alarm name.
`ResourceArn` is the ARN of the resource being monitored by the alarm. As alarms are updated from notifications, other attributes will be added to the record, including state, alarm namespace, state change time and record update time.

Consider using scripting or other tooling to add these records into the DynamoDB table.


## Set the Alarm Refresh Period in the Browser Application

The browser application will refresh it's view periodically. The refresh period is set using the Settings/Advanced Settings menu item. Change the refresh interval based on your needs.

As alarms change state and notifications are sent, the Alarms table will be updated and queries from the browser will retrieve the latest state of alarms.



## Navigate

Navigate to [README](README.md) | [Architecture](docs/README.md) |  [Workshop](WORKSHOP.md) | [Install](INSTALL.md) | [Usage](USAGE.md) | [Uninstall](UNINSTALL.md) | [Rest API](REST_API.md) | [Contributing](CONTRIBUTING.md)
