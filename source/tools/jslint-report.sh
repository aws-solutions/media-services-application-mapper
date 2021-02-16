#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

find . -name '*js' -type f -print | xargs -n 1 jslint --browser --long --predef define --fudge --white --edition es6 > jslint-report.txt
