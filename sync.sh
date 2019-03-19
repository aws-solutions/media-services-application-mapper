#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# local folders
ORIGIN=`pwd`
DIST=$ORIGIN/dist

# AWS settings
BUCKET="rodeolabz"
REGIONS="ap-south-1 eu-west-3 eu-north-1 eu-west-2 eu-west-1 ap-northeast-2 ap-northeast-1 sa-east-1 ca-central-1 ap-southeast-1 ap-southeast-2 eu-central-1 us-east-1 us-east-2 us-west-1 us-west-2"
DEPLOY_PROFILE="msam-release"

# sync the buckets
for R in $REGIONS; do 
    if [ "$R" != "us-west-2" ]; then
        aws s3 sync s3://$BUCKET-us-west-2/msam s3://$BUCKET-$R/msam --acl public-read --profile $DEPLOY_PROFILE --storage-class INTELLIGENT_TIERING
    fi
done
