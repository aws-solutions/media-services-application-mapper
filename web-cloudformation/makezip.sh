#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`
ZIP="$ORIGIN/webcontent_resource.zip"
HTML_ZIP=$1

rm -f $ZIP
pip install --force-reinstall --target ./package requests crhelper
cd package
zip -r9 $ZIP .
cd $ORIGIN
zip -g $ZIP lambda_function.py resource_tools.py cfn_invalidate_resource.py $HTML_ZIP
rm $HTML_ZIP
