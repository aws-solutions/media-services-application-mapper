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
    pip install --upgrade -r $source_dir/events/requirements.txt
else
    echo 'using current virtual environment for tests'
fi

echo
echo ---------------------------------
echo BACK-END UNIT TESTS
echo ---------------------------------

# launch python unit tests
cd $source_dir/msam
coverage run -m test.run_unit_tests
coverage xml
# fix the source file paths
sed -i -- 's/filename\=\"/filename\=\"source\/msam\//g' coverage.xml
echo coverage report is at $source_dir/msam/coverage.xml

cd $source_dir/events
coverage run -m test.run_unit_tests
coverage xml
# fix the source file paths
sed -i -- 's/filename\=\"/filename\=\"source\/events\//g' coverage.xml
echo coverage report is at $source_dir/events/coverage.xml

echo
echo ---------------------------------
echo  FRONT-END UNIT TESTS
echo ---------------------------------

# launch javascript unit tests for UI
cd $source_dir/html
rm -rf node_modules
npm install
npm test
# fix the source file paths
sed -i -- 's/SF:/SF:source\/html\//g' lcov.info
echo coverage report is at $source_dir/html/lcov.info

echo
echo ---------------------------------
echo CDK UNIT TESTS
echo ---------------------------------
echo
cd $source_dir/cdk
rm -rf node_modules
npm test
echo coverage report is at $source_dir/cdk/coverage/lcov.info
