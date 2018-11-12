#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`

# date stamp for this deploy
STAMP=`date +%s`
echo build stamp is $STAMP

# create work areas
STAGE="/tmp/msam"
if [ -d "$STAGE" ]; then
    rm -rf $STAGE
fi
mkdir -p $STAGE

HTMLWORK="/tmp/htmlwork"
if [ -d "$HTMLWORK" ]; then
    rm -rf $HTMLWORK
fi
mkdir -p $HTMLWORK

# add build stamp
cp -R $ORIGIN/html/ $HTMLWORK
echo "updating browser app build stamp"
sed -e "s/DEV_0_0_0/$STAMP/g" $ORIGIN/html/js/app/build.js >$HTMLWORK/js/app/build.js

# zip html for distribution; add to staging
cd $HTMLWORK
zip -q -r $STAGE/msam-web.zip *
cd $ORIGIN

# create a digest for the web content
SHATEXT="`sha1sum $STAGE/msam-web.zip | awk '{ print $1 }'`"
echo web content archive SHA1 is $SHATEXT

# rename web content archive, place into staging
cp -f $ORIGIN/web-cloudformation/webcontent_resource.zip $STAGE/webcontent_resource_$STAMP.zip

# place DynamoDB default settings resource into staging
cp -f $ORIGIN/api/msam/db/dynamodb_resource.zip $STAGE/dynamodb_resource_$STAMP.zip

# update symbols in templates
echo "updating template symbols"
sed -e "s/DEV_0_0_0/$STAMP/g" $ORIGIN/api/msam/build/msam-core-release.json >$STAGE/msam-core-release.json
sed -e "s/DEV_0_0_0/$STAMP/g" $ORIGIN/api/msam/build/msam-dynamodb-release.json >$STAGE/msam-dynamodb-release.json
sed -e "s/DEV_0_0_0/$STAMP/g" $ORIGIN/api/events/msam-events-release.json >$STAGE/msam-events-release.json

# update symbols in msam-browser-app-release.json
sed -e "s/CUSTOM_RESOURCE_FILE/webcontent_resource_$STAMP.zip/g" web-cloudformation/msam-browser-app-release.json | \
    sed -e "s/ZIP_DIGEST_VALUE/$SHATEXT/g" | \
    sed -e "s/DEV_0_0_0/$STAMP/g" >$STAGE/msam-browser-app-release.json

# sync staging to us-west-2
aws s3 sync $STAGE/ s3://rodeolabz-us-west-2/msam

# sync us-west-2 content to other S3 regional buckets
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-ap-northeast-1/msam --delete
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-ap-northeast-2/msam --delete   
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-ap-southeast-1/msam --delete
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-ap-southeast-2/msam --delete
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-eu-central-1/msam --delete
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-eu-west-1/msam --delete
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-eu-west-3/msam --delete
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-sa-east-1/msam --delete
aws s3 sync s3://rodeolabz-us-west-2/msam s3://rodeolabz-us-east-1/msam --delete
