#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`

# MSAM core template

echo
echo ------------------------------------
echo MSAM Core Template
echo ------------------------------------
echo

cd msam
chalice package build/
cd build/
aws cloudformation package --template-file sam.json --s3-bucket rodeolabz-us-west-2 --s3-prefix msam --use-json --output-template-file msam-core.json
cd $ORIGIN

# MSAM event collector template

echo
echo ------------------------------------
echo Event Collector Template
echo ------------------------------------
echo

cd events
aws cloudformation package --template-file MSAMEventCollector.yml --s3-bucket rodeolabz-us-west-2 --s3-prefix msam --use-json --output-template-file msam-events.json
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
