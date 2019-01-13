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
zip -q -r $STAGE/msam-web-$STAMP.zip *
cd $ORIGIN

# create a digest for the web content
SHATEXT="`sha1sum $STAGE/msam-web-$STAMP.zip | awk '{ print $1 }'`"
echo web content archive SHA1 is $SHATEXT

# update webcontent_resource.zip
cd $ORIGIN/web-cloudformation
./makezip.sh
cd $ORIGIN

# place web content archive into staging
cp -f $ORIGIN/web-cloudformation/webcontent_resource.zip $STAGE/webcontent_resource_$STAMP.zip

# place DynamoDB default settings resource into staging
cp -f $ORIGIN/api/msam/db/dynamodb_resource.zip $STAGE/dynamodb_resource_$STAMP.zip

# copy stock templates to staging
cp -f $ORIGIN/api/msam/build/msam-core-release.json $STAGE/
cp -f $ORIGIN/api/msam/build/msam-dynamodb-release.json $STAGE/
cp -f $ORIGIN/api/events/msam-events-release.json $STAGE/
cp -f $ORIGIN/web-cloudformation/msam-browser-app-release.json $STAGE/

# update symbols in templates
echo "updating template symbols"
cd $STAGE
TEMPLATES=`find . -name '*.json' -type f `

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/DEV_0_0_0/$STAMP/g"

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/ZIP_DIGEST_VALUE/$SHATEXT/g"

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/CUSTOM_RESOURCE_FILE/webcontent_resource_$STAMP.zip/g"

# clean up
rm -f $STAGE/*.json-e

# copy processed templates to build-stamp-named templates
for F in *.json; do
    cp -f ${F} ${F/\.json/\-${STAMP}\.template}
done

# generate digest values
md5sum * >$DIST/md5.txt
shasum -a 1 * >$DIST/sha1.txt
shasum -a 256 * >$DIST/sha256.txt

# hosted web locations
echo >$DIST/hosted.txt 
FILES=`find . -type f -exec basename {} \;`
for F in $FILES; do
    echo https://rodeolabz-us-west-2.s3.amazonaws.com/msam/$F >>$DIST/hosted.txt 
done

# copy processed templates back to dist
cp -f *.json $DIST/

# remove release templates before push?
if [ "$1" == "release" ]; then
    echo "keeping release templates"
else
    echo "removing release templates"
    rm -f *.json
fi

cd $ORIGIN

# sync the buckets
for R in $REGIONS; do 
    aws s3 sync $STAGE/ s3://$BUCKET-$R/msam --acl public-read --profile $DEPLOY_PROFILE --storage-class INTELLIGENT_TIERING
done
