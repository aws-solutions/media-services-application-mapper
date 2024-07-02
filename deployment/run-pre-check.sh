#!/usr/bin/env bash
#
# Scan the solution to check coding styles and security vulnerabilities
#
# This script is dependent on Trufflehog (https://github.com/trufflesecurity/trufflehog.git)
# and Golang (https://go.dev/)
# if trufflehog is not installed in the system, it will clone the repository and install using Go
#

set -e

# Get reference for all important directories
declare -r root_dir="$(cd "`dirname "${BASH_SOURCE[0]}"`/.."; pwd)"
declare -r deployment_dir="${root_dir}/deployment"
declare -r source_dir="${root_dir}/source"

cd "$root_dir"

echo "Checking Python Virtual Env"
# python virtual environment
test_venv_name="test_venv"

if ! python3 "$deployment_dir/venv_check.py"; then
    echo 'creating temporary virtual environment for testing'
    python3 -m venv $test_venv_name
    source $test_venv_name/bin/activate
else
    echo 'using current virtual environment for tests'
fi

# Trufflehog (https://github.com/trufflesecurity/trufflehog.git) is a tool that scans for exposed credentials
echo "Trufflehog Scan started"
# if trufflehog already installed locally, skip installation step
if ! command -v trufflehog &>/dev/null; then
    echo "Installing Trufflehog"
    # fixes error if you try and run this script twice. Remove old directory from git clone.
    if [ -d "trufflehog" ]; then
        echo "Removing existing Trufflehog directory"
        rm -rf trufflehog
    fi
    git clone https://github.com/trufflesecurity/trufflehog.git --branch v3.54.1
    cd trufflehog && go install
fi
cd "$root_dir"
find . ! -path "*trufflehog*" ! -path "*test_venv*" ! -path "*.git*" ! -path "*pkg*" ! -path "." | \
    xargs trufflehog --fail filesystem
if [ $? -ne 0 ]; then
    echo "ERROR: trufflehog scan failed"
    exit 1
fi
echo "Trufflehog Scan finished"

echo -e "\n\n"
echo "Bandit Scan started"
pip install bandit
bandit source
if [ $? -ne 0 ]; then
    echo "ERROR: bandit scan failed"
    exit 1
fi
echo "Bandit Scan finished"

echo -e "\n\n"
echo "Pylint Scan started"
pip install pylint
cd "$source_dir/msam"
find . -iname '*.py' | \
    grep "/package/" --invert-match | \
    grep "/.aws-sam/" --invert-match | \
    xargs pylint -d E0401,C0103,C0301,C0302,C0303,C0411,C0412,C0413,R0201,R0801,R1702,R0912,R0913,R0914,R0915,W0105,W0401,W0703,W0603,W0613,W0621,W0640
if [ $? -ne 0 ]; then
    echo "ERROR: pylint source/msam scan failed"
    exit 1
fi
cd "$source_dir/events"
find . -iname '*.py' | \
    grep "/package/" --invert-match | \
    grep "/.aws-sam/" --invert-match | \
    xargs pylint -d E0401,C0103,C0301,C0302,C0303,C0411,C0412,C0413,R0201,R0801,R1702,R0912,R0913,R0914,R0915,W0105,W0401,W0703,W0603,W0613,W0621,W0640
if [ $? -ne 0 ]; then
    echo "ERROR: pylint source/events scan failed"
    exit 1
fi
echo "Pylint Scan finished"

echo -e "\n\n"
echo "JsHint Scan started"
npm install -g jshint
cd "$source_dir/html/js/app"
find . -name '*.js' -type f -print | \
    grep --invert-match "/external/" | \
    xargs -I{} jshint {}
if [ $? -ne 0 ]; then
    echo "ERROR: jshint scan failed"
    exit 1
fi
echo "JsHint Scan finished"

echo -e "\n\n"
echo "Eslint Scan started"
npm i -g eslint@9.0.0
cd "$source_dir/html"
export ESLINT_USE_FLAT_CONFIG=false
eslint -c .eslintrc.json .
if [ $? -ne 0 ]; then
    echo "ERROR: eslint scan failed"
    exit 1
fi
echo "Eslint Scan finished"

echo 'deleting temporary virtual environment for testing and trufflehog'
cd "$root_dir"
rm -rf trufflehog $test_venv_name

echo All scans finished successfully

set +e
