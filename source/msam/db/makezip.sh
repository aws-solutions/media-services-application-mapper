#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`
ZIP="$ORIGIN/dynamodb_resource.zip"

rm -f $ZIP error.txt
pip install --upgrade --force-reinstall --target ./package crhelper 2> error.txt
RETVAL=$?
if [ "$RETVAL" -ne "0" ]; then
    echo "ERROR: Database package installation failed."
    cat error.txt
    exit $RETVAL
fi
cd package
zip -r9 $ZIP .
cd $ORIGIN
zip -g $ZIP lambda_function.py
