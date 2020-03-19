import json
from jsonpath_ng import parse

TEMPLATE_FILE = "msam-core-release.json"
TEMPLATE_DESCRIPTION = "Media Services Application Mapper (MSAM) cloud API (SO0048) (ID: DEV_0_0_0)"

SSM_DOCUMENTS = "ssm_documents.json"
# replace the absolute path to the bucket of the code URI with a region-dependent one
CODE_URI = {"Key": "msam/",
            "Bucket": {"Fn::Join": ["-",[{"Ref": "BucketBasename"},{"Ref": "AWS::Region"}]]}}
# update the environment variables to be dynamic
ENV_VARS = {
    "ALARMS_TABLE_NAME": {
        "Ref": "AlarmsTableName"
    },
    "BUILD_STAMP": "DEV_0_0_0",
    "CACHE_ITEM_TTL": {
        "Ref": "CacheItemTTL"
    },
    "CHANNELS_TABLE_NAME": {
        "Ref": "ChannelsTableName"
    },
    "CONTENT_TABLE_NAME": {
        "Ref": "ContentTableName"
    },
    "EVENTS_TABLE_NAME": {
        "Ref": "EventsTableName"
    },
    "CLOUDWATCH_EVENTS_TABLE_NAME": {
        "Ref": "CloudWatchEventsTableName"
    },
    "LAYOUT_TABLE_NAME": {
        "Ref": "LayoutTableName"
    },
    "SETTINGS_TABLE_NAME": {
        "Ref": "SettingsTableName"
    }
}
# add parameters to the template
PARAMETERS = {
    "AlarmsTableName": {
        "Description": "This is the DynamoDB table name that stores alarm states for MSAM.",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    },
    "ChannelsTableName": {
        "Description": "This is the DynamoDB table name that stores channel definitions for MSAM.",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    },
    "ContentTableName": {
        "Description": "This is the DynamoDB table name that stores cached content for MSAM.",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    },
    "EventsTableName": {
        "Description": "This is the DynamoDB table name that collects events for MSAM.",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    },
    "LayoutTableName": {
        "Description": "This is the DynamoDB table name that stores diagram layout for MSAM.",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    },
    "SettingsTableName": {
        "Description": "This is the DynamoDB table name that stores configuration settings for MSAM.",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    },
    "CloudWatchEventsTableName": {
        "Description": "This is the DynamoDB table name that stores CloudWatch events for MSAM.",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    },
    "CacheItemTTL": {
        "Default": "7200",
        "Description": "This is the maximum time in seconds a cached item will remain if never updated.",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    },
    "BucketBasename": {
        "Description": "This is the basename of the bucket that holds the MSAM code base.",
        "Default": "rodeolabz",
        "Type": "String",
        "AllowedPattern": "\\S+",
        "MinLength": 1,
        "ConstraintDescription": "Please enter a value for this field."
    }
}
USAGE_PLAN_KEY = {
    "Type": "AWS::ApiGateway::UsagePlanKey",
    "Properties": {
        "KeyId": {"Ref": "APIKey"},
        "KeyType": "API_KEY",
        "UsagePlanId": {"Ref": "UsagePlan"}
    }
}
USAGE_PLAN = {
    "Type": "AWS::ApiGateway::UsagePlan",
    "Properties": {
        "ApiStages": [{
            "ApiId": {"Ref": "RestAPI"},
            "Stage": "msam"
        }],
        "Description": "MSAM default usage plan",
        "UsagePlanName": "MSAM Usage Plan"
    },
    "DependsOn": "RestAPImsamStage"
}
API_KEY = {
    "Type": "AWS::ApiGateway::ApiKey",
    "Properties": {
        "Description": "MSAM default API key",
        "Enabled": "true"
    }
}
OUTPUTS = {
    "RestAPIId": {
        "Value": {
            "Ref": "RestAPI"
        }
    },
    "EndpointURL": {
        "Value": {
            "Fn::Sub": "https://${RestAPI}.execute-api.${AWS::Region}.amazonaws.com/msam/"
        }
    },
    "APIKeyID": {
        "Value": {
            "Fn::Join": [
                "",
                [{
                    "Fn::Sub": "https://${AWS::Region}.console.aws.amazon.com/apigateway/home?region=${AWS::Region}#/api-keys/"
                },
                    {
                    "Ref": "APIKey"
                }
                ]
            ]
        }
    }
}

CW_ALARM_DESCRIPTION = "MSAM Lambda for handling CloudWatch alarm notifications"
UPDATE_NODES_DESCRIPTION = "MSAM Lambda for periodically updating the node cache"
UPDATE_CONNECTIONS_DESCRIPTION = "MSAM Lambda for peridically updating the connection cache"
UPDATE_ALARMS_DESCRIPTION = "MSAM Lambda for polling CloudWatch alarm states"
UPDATE_FROM_TAGS_DESCRIPTION = "MSAM Lambda for handling diagram and tile updates from tags"
API_HANDLER_DESCRIPTION = "MSAM Lambda for handling requests from clients"
SSM_RUN_CMD_DESCRIPTION = "MSAM Lambda for running all applicable commands for a given managed instance"
SSM_PROCESS_RUN_CMD_DESCRIPTION = "MSAM Lambda for processing outputs from running a command on a managed instance"

def main():
    template = {}
    ssm_doc_json = {}

    with open(SSM_DOCUMENTS, "r") as json_file:
        ssm_doc_json = json.load(json_file)

    # read file
    with open(TEMPLATE_FILE, "r") as read_file:
        template = json.load(read_file)
        uri_expr = parse('$..CodeUri')
        code_uris = [match.value for match in uri_expr.find(template)]
        env_var_expr = parse('$..Variables')

        # parse out the key
        key = code_uris[0].split('/')[-1]
        CODE_URI["Key"] = CODE_URI["Key"]+key
        # update all the code URIs
        uri_expr.update(template, CODE_URI)
        # update all the env vars
        env_var_expr.update(template, ENV_VARS)
        # add parameters
        template["Parameters"] = PARAMETERS
        # add Description
        template["Description"] = TEMPLATE_DESCRIPTION
        # add API Key related resources
        template["Resources"]["UsagePlanKeyAssociation"] = USAGE_PLAN_KEY
        template["Resources"]["UsagePlan"] = USAGE_PLAN
        template["Resources"]["APIKey"] = API_KEY
        # update Lambda descriptions
        template["Resources"]["IncomingCloudwatchAlarm"]["Properties"]["Description"] = CW_ALARM_DESCRIPTION
        template["Resources"]["UpdateNodes"]["Properties"]["Description"] = UPDATE_NODES_DESCRIPTION
        template["Resources"]["UpdateConnections"]["Properties"]["Description"] = UPDATE_CONNECTIONS_DESCRIPTION
        template["Resources"]["UpdateAlarms"]["Properties"]["Description"] = UPDATE_ALARMS_DESCRIPTION
        template["Resources"]["UpdateFromTags"]["Properties"]["Description"] = UPDATE_FROM_TAGS_DESCRIPTION
        template["Resources"]["APIHandler"]["Properties"]["Description"] = API_HANDLER_DESCRIPTION
        template["Resources"]["SsmRunCommand"]["Properties"]["Description"] = SSM_RUN_CMD_DESCRIPTION
        template["Resources"]["ProcessSsmRunCommand"]["Properties"]["Description"] = SSM_PROCESS_RUN_CMD_DESCRIPTION
        # add the SSM document resources
        template["Resources"].update(ssm_doc_json)
        
        # update outputs
        template["Outputs"] = OUTPUTS
    with open(TEMPLATE_FILE, "w") as write_file:
        json.dump(template, write_file, indent=4)


if __name__ == "__main__":
    main()
