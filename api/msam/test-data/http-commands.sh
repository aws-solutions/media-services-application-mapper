#!/bin/sh

export ENDPOINT="https://zvrnxd2kmb.execute-api.us-west-2.amazonaws.com/msam"

# all defined alarms for us-west-2 (reduced output)
http $ENDPOINT/cloudwatch/alarms/all/us-west-2 "x-api-key:uvZ3fzgcq72J0msKcoqGJ49adLUj2yox4ifX7oRC"

# subscribe ARNs
http $ENDPOINT/cloudwatch/alarm/TargetTracking-table%2FSandbox-Tables-Events-1DR9ZZ7OY3Q8U%2Findex%2Fresource_arn-alarm_state-index-AlarmLow-05e52d46-82a4-4ae0-8502-7347dda3f757/region/us-west-2/subscribe "x-api-key:uvZ3fzgcq72J0msKcoqGJ49adLUj2yox4ifX7oRC" <alarm_subscribe.json

# unsubscribe ARNs
http $ENDPOINT/cloudwatch/alarm/TargetTracking-table%2FSandbox-Tables-Events-1DR9ZZ7OY3Q8U%2Findex%2Fresource_arn-alarm_state-index-AlarmLow-05e52d46-82a4-4ae0-8502-7347dda3f757/region/us-west-2/unsubscribe "x-api-key:uvZ3fzgcq72J0msKcoqGJ49adLUj2yox4ifX7oRC" <alarm_subscribe.json

# subscribers to a specific alarm
http $ENDPOINT/cloudwatch/alarm/TargetTracking-table%2FSandbox-Tables-Events-1DR9ZZ7OY3Q8U%2Findex%2Fresource_arn-alarm_state-index-AlarmLow-05e52d46-82a4-4ae0-8502-7347dda3f757/region/us-west-2/subscribers "x-api-key:uvZ3fzgcq72J0msKcoqGJ49adLUj2yox4ifX7oRC"

# subscribers to alarms in ALARM state
http $ENDPOINT/cloudwatch/alarms/ALARM/subscribers "x-api-key:uvZ3fzgcq72J0msKcoqGJ49adLUj2yox4ifX7oRC"

# subscribers to alarms in OK state
http $ENDPOINT/cloudwatch/alarms/OK/subscribers "x-api-key:uvZ3fzgcq72J0msKcoqGJ49adLUj2yox4ifX7oRC"

# all subscribed alarms
http $ENDPOINT/cloudwatch/alarms/subscribed "x-api-key:uvZ3fzgcq72J0msKcoqGJ49adLUj2yox4ifX7oRC"

# alarms for subscribed resource
http $ENDPOINT/cloudwatch/alarms/subscriber/arn%3Aaws%3Amedialive%3Aus-west-2%3A658937807431%3Ainput%3A8438738 "x-api-key:uvZ3fzgcq72J0msKcoqGJ49adLUj2yox4ifX7oRC"

