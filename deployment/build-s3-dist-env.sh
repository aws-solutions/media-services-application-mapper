#!/bin/bash

# This script is used to configure the virtual build environment 
# required by the solution.

set -euo pipefail

# get reference for all important folders
template_dir="$PWD"
current_dir="$PWD"
source_dir="$template_dir/../source"

# configure the environment
pip install --upgrade -r requirements.txt

exit 0
