#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`
BUCKET_BASENAME='rodeolabz' 
# MSAM core template

# ./build.sh mybucket

# override default 
if [ "$1" != "" ]; then
    BUCKET_BASENAME=$1
fi

echo $BUCKET_BASENAME

echo
echo ------------------------------------
echo MSAM Core Template
echo ------------------------------------
echo

cd msam
chalice package build/
cd build/
aws cloudformation package --template-file sam.json --s3-bucket $BUCKET_BASENAME-us-west-2 --s3-prefix msam --use-json --output-template-file msam-core-release.json --profile default
# update env vars and code uris; add description and parameters
python update_core_template.py 
cd $ORIGIN

# MSAM event collector template

echo
echo ------------------------------------
echo Event Collector Template
echo ------------------------------------
echo

cd events
# sam build first to include dependencies in requirements. txt
sam build --template MSAMEventCollector.yml --manifest requirements.txt --region us-west-2 --profile default
aws cloudformation package --template-file .aws-sam/build/template.yaml --s3-bucket $BUCKET_BASENAME-us-west-2 --s3-prefix msam --use-json --output-template-file msam-events-release.json --profile default
# replace code uris with a dynamic one
python update_event_template.py

cd $ORIGIN

# MSAM database custom resource

echo
echo ------------------------------------
echo Settings default custom resource
echo ------------------------------------
echo

cd msam/db
./makezip.sh
cd $ORIGIN

echo
echo ------------------------------------
echo Finished
echo ------------------------------------
echo
echo Merge the generated template changes into the release templates, then run deploy.sh
echo
