#!/bin/sh

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

ORIGIN=`pwd`
ZIP="$ORIGIN/webcontent_resource.zip"
HTML_ZIP=$1



if [ -d "package" ]; then
  rm -rf package
fi

rm -f $ZIP
rm -f error.txt

pip install --force-reinstall --target ./package requests crhelper 2> error.txt
RETVAL=$?
if [ "$RETVAL" -ne "0" ]; then
    echo "ERROR: System package installation failed."
    cat error.txt
    exit $RETVAL
fi
cd package
zip -r9 $ZIP .
cd $ORIGIN
zip -g $ZIP cfn_bucket_loader.py cfn_invalidate_resource.py $HTML_ZIP
rm $HTML_ZIP
