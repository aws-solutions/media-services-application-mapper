import json
import boto3
import os
import argparse

def main():
    try:
        parser = argparse.ArgumentParser(description='Copy database items from one DynamoDB table to another.')
        parser.add_argument('--source', required=True, help='source table name')
        parser.add_argument('--destination', required=True, help='destination table name')
        parser.add_argument('--region', default='us-west-2', help='the region where the tables reside (if not provided, default is us-west-2)')
        parser.add_argument('--profile', default='default', help='the AWS profile to use (if not provided, default profile is used)')

        args = parser.parse_args()

        session = boto3.Session(profile_name=args.profile, region_name=args.region)
        dynamo_resource = session.resource('dynamodb')
        source_table = dynamo_resource.Table(args.source)
        destination_table = dynamo_resource.Table(args.destination)

        scanned_items = []
        response = source_table.scan()
        if "Items" in response:
            scanned_items = response["Items"]
        while "LastEvaluatedKey" in response:
            response = source_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            if "Items" in response:
                scanned_items = scanned_items + response["Items"]
        #print(scanned_items)
                
        for item in scanned_items:
            destination_table.put_item(
                    Item=item
            )
    except Exception as error:
        print(error)
    return

if __name__ == "__main__":
    main()
