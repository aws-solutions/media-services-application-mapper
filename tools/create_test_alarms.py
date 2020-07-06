import boto3
import copy
import time
import json

ALARM_TEMPLATE = {
    "AlarmName": "1193839-0 Active Alerts",
    "AlarmDescription": "1193839-0 Active Alerts",
    "ActionsEnabled": True,
    "OKActions": [
    ],
    "AlarmActions": [
    ],
    "InsufficientDataActions": [],
    "MetricName": "ActiveAlerts",
    "Namespace": "MediaLive",
    "Statistic": "Maximum",
    "Dimensions": [{
            "Name": "ChannelId",
            "Value": "1193839"
        },
        {
            "Name": "Pipeline",
            "Value": "0"
        }
    ],
    "Period": 10,
    "EvaluationPeriods": 1,
    "DatapointsToAlarm": 1,
    "Threshold": 1.0,
    "ComparisonOperator": "GreaterThanOrEqualToThreshold",
    "TreatMissingData": "missing"
}

TOTAL_ALARMS = 500

client = boto3.client("cloudwatch")
for index in range(TOTAL_ALARMS):
    print(index)
    alarm_configuration = copy.deepcopy(ALARM_TEMPLATE)
    alarm_configuration["AlarmName"] = f"MSAM Test Alarm {time.time()}"
    alarm_configuration["AlarmDescription"] = "MSAM Testing Only, Do Not Use"
    print(json.dumps(alarm_configuration))
    response = client.put_metric_alarm(**alarm_configuration)
    print(json.dumps(response))
    time.sleep(0.25)
