#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`
ZIP="$ORIGIN/webcontent_resource.zip"

rm -f $ZIP
zip -r $ZIP lambda_function.py resource_tools.py
# cd ..
# zip -r -u $ZIP html/*
