#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`
ZIP="$ORIGIN/dynamodb_resource.zip"

rm -f $ZIP
pip install --upgrade --force-reinstall --target ./package requests 2> error.txt
if [ -s error.txt ]; then
    echo "ERROR: Database package installation failed."
    cat error.txt
    rm error.txt
    exit 1
fi
cd package
zip -r9 $ZIP .
cd $ORIGIN
zip -g $ZIP lambda_function.py resource_tools.py
