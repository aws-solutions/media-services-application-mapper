#!/bin/sh

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

find . -iname '*js' -type f -print | xargs -n 1 js-beautify -r
