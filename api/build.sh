#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# MSAM core template

cd msam
chalice package build/
cd build/
aws cloudformation package --template-file sam.json --s3-bucket rodeolabz-us-west-2 --s3-prefix msam --use-json --output-template-file msam-core.json

cd ../..

# MSAM event collector template

cd events
aws cloudformation package --template-file MSAMEventCollector.yml --s3-bucket rodeolabz-us-west-2 --s3-prefix msam --use-json --output-template-file msam-events.json


echo ***
echo merge the generated template changes into the release templates, then run deploy.sh
echo ***
