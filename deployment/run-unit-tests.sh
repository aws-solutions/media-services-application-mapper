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
current_dir="$PWD"
source_dir="$template_dir/../source"

# PYTHON UNIT TESTS
test_venv_name="test_venv"
test_venv_dir="$current_dir/$test_venv_name"

# clean up testing venv if present
rm -rf $test_venv_dir

# check if we need a new testing venv
./venv_check.py
if [ $? == 1 ]; then
    echo 'creating temporary virtual environment for testing'
    python3 -m venv $test_venv_name
    source $test_venv_name/bin/activate
    # configure the environment
    pip install --upgrade -r requirements.txt
    pip install --upgrade -r $source_dir/msam/requirements.txt
else
    echo 'using current virtual environment for tests'
fi

# launch python unit tests
cd $source_dir/msam
coverage run -m chalicelib.run_unit_tests
coverage lcov
