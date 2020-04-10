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
ACL="public-read"
DEPLOY_TYPE="dev"

# ./deploy.sh dev -b mybucket -r "us-west-2 us-east-1" -d default -a none
while getopts 'b:r:p:a:t:h' OPTION; do
  case "$OPTION" in
    b)
      BUCKET="$OPTARG"
      ;;
    r)
      REGIONS="$OPTARG"
      ;;
    p)
      DEPLOY_PROFILE="$OPTARG"
      ;;
    a)
      ACL="$OPTARG"
      ;;
    t)
      DEPLOY_TYPE="$OPTARG"
      ;;
    h)
      echo "script usage: $(basename $0) [-b BucketBasename] [-r RegionsForDeploy] [-p AWSProfile] [-a ACLSettings(public-read|none)] [-t DeployType(dev|release)]" >&2
      echo "example usage: $(basename $0) -b mybucket -r \"us-west-2 us-east-1\" -p default -a public-read -t dev" >&2
      exit 1
      ;;
    ?)
      echo "script usage: $(basename $0) [-b BucketBasename] [-r RegionsForDeploy] [-p AWSProfile] [-a ACLSettings(public-read|none)] [-t DeployType(dev|release)]" >&2
      exit 1
      ;;
  esac
done
shift "$(($OPTIND -1))"


echo AWS Profile = $DEPLOY_PROFILE
echo Bucket Basename = $BUCKET
echo Regions = $REGIONS
echo ACL Setting = $ACL
echo Deploy Type = $DEPLOY_TYPE

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
cp $STAGE/msam-web-$STAMP.zip .
./makezip.sh msam-web-$STAMP.zip
cd $ORIGIN

# place web content archive into staging
cp -f $ORIGIN/web-cloudformation/webcontent_resource.zip $STAGE/webcontent_resource_$STAMP.zip

# place DynamoDB default settings resource into staging
cp -f $ORIGIN/api/msam/db/dynamodb_resource.zip $STAGE/dynamodb_resource_$STAMP.zip

# copy stock templates to staging
cp -f $ORIGIN/api/msam/build/msam-all-resources-release.json $STAGE/
cp -f $ORIGIN/api/msam/build/msam-core-release.json $STAGE/
cp -f $ORIGIN/api/msam/build/msam-dynamodb-release.json $STAGE/
cp -f $ORIGIN/api/events/msam-events-release.json $STAGE/
cp -f $ORIGIN/web-cloudformation/msam-browser-app-release.json $STAGE/
cp -f $ORIGIN/api/msam/build/msam-iam-roles-release.json $STAGE/

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

# released template web locations
rm -f /tmp/release.txt 
FILES=`find . -iname '*release*json' -type f -exec basename {} \;`
for F in $FILES; do
    echo https://$BUCKET-us-west-2.s3.amazonaws.com/msam/$F >>/tmp/release.txt 
done
sort </tmp/release.txt >$DIST/release.txt

# current build template web locations
rm -f /tmp/current.txt 
FILES=`find . -iname '*template' -type f -exec basename {} \;`
for F in $FILES; do
    echo https://$BUCKET-us-west-2.s3.amazonaws.com/msam/$F >>/tmp/current.txt 
done
sort </tmp/current.txt >$DIST/current.txt

# copy processed templates back to dist
cp -f *.json $DIST/

# remove release templates before push?
if [ $DEPLOY_TYPE == "release" ]; then
    echo "keeping release templates"
else
    echo "removing release templates"
    rm -f *.json
fi

cd $ORIGIN
# sync to us-west-2
if [ $ACL == "public-read" ]; then
    aws s3 sync $STAGE/ s3://$BUCKET-us-west-2/msam --acl public-read --profile $DEPLOY_PROFILE --storage-class INTELLIGENT_TIERING
else
    aws s3 sync $STAGE/ s3://$BUCKET-us-west-2/msam --profile $DEPLOY_PROFILE --storage-class INTELLIGENT_TIERING
fi

# sync the buckets
for R in $REGIONS; do 
    if [ "$R" != "us-west-2" ]; then
        if [ $ACL == "public-read" ]; then
            aws s3 sync s3://$BUCKET-us-west-2/msam s3://$BUCKET-$R/msam --acl public-read --profile $DEPLOY_PROFILE --storage-class INTELLIGENT_TIERING
        else
            aws s3 sync s3://$BUCKET-us-west-2/msam s3://$BUCKET-$R/msam --profile $DEPLOY_PROFILE --storage-class INTELLIGENT_TIERING
        fi
    fi
done
