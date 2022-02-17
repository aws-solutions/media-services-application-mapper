#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh
#

# get reference for all important folders
template_dir="$PWD"
source_dir="$template_dir/../source"

# launch python unit tests
cd $source_dir/msam
python -m chalicelib.run_unit_tests
