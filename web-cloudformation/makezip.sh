#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`
ZIP="$ORIGIN/webcontent_resource.zip"
HTML_ZIP=$1

rm -f $ZIP
pip install --target ./package requests
cd package
zip -r9 $ZIP .
cd $ORIGIN
zip -g $ZIP lambda_function.py resource_tools.py $HTML_ZIP
rm $HTML_ZIP
