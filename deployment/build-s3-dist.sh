#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name solution-name version-code
#
# Paramenters:
#  - source-bucket-base-name: Name for the S3 bucket location where the template will source the Lambda
#    code from. The template will append '-[region_name]' to this bucket name.
#    For example: ./build-s3-dist.sh solutions v1.0.0
#    The template will then expect the source code to be located in the solutions-[region_name] bucket
#
#  - solution-name: name of the solution for consistency
#
#  - version-code: version of the package

set -euo pipefail

# only option h is allowed to display help message
while getopts ':h' OPTION; do
  case "$OPTION" in
    h)
      echo
      echo "script usage: $(basename $0) DIST_OUTPUT_BUCKET SOLUTION_NAME VERSION"
      echo "example usage: ./$(basename $0) mybucket aws-media-services-application-mapper v1.8.0"
      echo
      echo "If no arguments are passed in, the following default values are used:"
      echo "DIST_OUTPUT_BUCKET=rodeolabz"
      echo "SOLUTION_NAME=aws-media-services-application-mapper"
      echo "VERSION=v1.0.0"
      echo
      echo "You may export export these variables in your environment and call the script using those variables:"
      echo "./$(basename $0) \$DIST_OUTPUT_BUCKET \$SOLUTION_NAME \$VERSION"
      echo 
      exit 1
      ;;
    ?)
      echo "script usage: $(basename $0) DIST_OUTPUT_BUCKET SOLUTION_NAME VERSION"
      exit 1
      ;;
  esac
done

ORIGIN=`pwd`
DIST_OUTPUT_BUCKET="$1" 
SOLUTION_NAME="$2"
VERSION="$3"

# Set defaults if variables are not set:
if [ -z "$1" ]
  then
    echo "Setting default base source bucket name to rodeolabz."
    DIST_OUTPUT_BUCKET='rodeolabz'
fi
if [ -z "$2" ] 
  then
    echo "Setting default solution name to media-service-application-mapper."
    SOLUTION_NAME='aws-media-service-application-mapper'
fi

if [ -z "$3" ]
  then
    echo "Setting default version to v1.0.0"
    VERSION='v1.0.0'
fi

template_dir="$PWD" # /deployment
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
other_dist_dir="$template_dir/assets"
source_dir="$template_dir/../source"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old dist, node_modules and bower_components folders"
echo "------------------------------------------------------------------------------"
echo "rm -rf $template_dist_dir"
rm -rf $template_dist_dir
echo "mkdir -p $template_dist_dir"
mkdir -p $template_dist_dir
echo "rm -rf $build_dist_dir"
rm -rf $build_dist_dir
echo "mkdir -p $build_dist_dir"
mkdir -p $build_dist_dir
echo "rm -rf $other_dist_dir"
rm -rf $other_dist_dir
echo "mkdir -p $other_dist_dir"
mkdir -p $other_dist_dir

# date stamp for this build
STAMP=`date +%s`
echo build stamp is $STAMP

# move to the source dir first
cd $source_dir
# MSAM core template
echo
echo ------------------------------------
echo MSAM Core Template
echo ------------------------------------
echo

cd msam
chalice package --merge-template merge_template.json build/
if [ $? -ne 0 ]; then
  echo "ERROR: running chalice package"
  exit 1
fi
cd build/
# mv zip file to regional asset dir
mv deployment.zip $build_dist_dir/core_$STAMP.zip
# rename sam.json
mv sam.json msam-core-release.template
# cp all the templates in build to templates dir
echo "copying all templates in msam/build dir to $template_dist_dir"
cp *.template $template_dist_dir

# MSAM event collector template
echo
echo ------------------------------------
echo Event Collector Template
echo ------------------------------------
echo

EVENTS_ZIP="events.zip"
cd $source_dir/events

# install all the requirements into package dir
pip install --upgrade --force-reinstall --target ./package -r requirements.txt 2> error.txt
if [ -s error.txt ]; then
  echo "ERROR: Event collector package installation failed."
  cat error.txt
  rm error.txt
  exit 1
fi

cd package
zip -r9 ../$EVENTS_ZIP .
cd ../
zip -g $EVENTS_ZIP cloudwatch_alarm.py media_events.py
mv $EVENTS_ZIP $build_dist_dir/events_$STAMP.zip
cp msam-events-release.template $template_dist_dir

# MSAM database custom resource
echo
echo ------------------------------------
echo Settings default custom resource
echo ------------------------------------
echo

cd $source_dir/msam/db
./makezip.sh
if [ $? -ne 0 ]; then
  echo "ERROR: Packaging up DB files."
  exit 1
fi
mv dynamodb_resource.zip $build_dist_dir/dynamodb_resource_$STAMP.zip

# add build stamp
cd $source_dir/html
echo "updating browser app build stamp"
cp -f js/app/build-tmp.js js/app/build.js
sed -i -e "s/DEV_0_0_0/$STAMP/g" js/app/build.js
zip -q -r $build_dist_dir/msam-web-$STAMP.zip *
rm -f js/app/build.js-e

# create a digest for the web content
SHATEXT="`sha1sum $build_dist_dir/msam-web-$STAMP.zip | awk '{ print $1 }'`"
echo web content archive SHA1 is $SHATEXT

# update webcontent_resource.zip 
cd $source_dir/web-cloudformation
cp $build_dist_dir/msam-web-$STAMP.zip .
./makezip.sh msam-web-$STAMP.zip
if [ $? -ne 0 ]; then
  echo "ERROR: Packaging up web files."
  exit 1
fi
mv webcontent_resource.zip $build_dist_dir/webcontent_resource_$STAMP.zip
cp msam-browser-app-release.template $template_dist_dir

# update symbols in templates
echo "updating template symbols"
cd $template_dist_dir
TEMPLATES=`find . -name '*.template' -type f `

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/DEV_0_0_0/$STAMP/g"

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/%%BUCKET_NAME%%/$DIST_OUTPUT_BUCKET/g"

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/%%SOLUTION_NAME%%/$SOLUTION_NAME/g"

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/%%VERSION%%/$VERSION/g"

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/ZIP_DIGEST_VALUE/$SHATEXT/g"

echo $TEMPLATES | \
    xargs -n 1 sed -i -e "s/CUSTOM_RESOURCE_FILE/webcontent_resource_$STAMP.zip/g"

# clean up
rm -f $template_dist_dir/*.template-e

# copy processed templates to build-stamp-named templates
for F in *.template; do
    cp -f ${F} ${F/\.template/\-${STAMP}\.template}
done

# copy the main template to the deployment dir
cp aws-media-services-application-mapper-release.template $template_dir

# generate digest values for the templates
md5sum * >$other_dist_dir/md5.txt
sha1sum * >$other_dist_dir/sha1.txt
sha256sum * >$other_dist_dir/sha256.txt

cd $build_dist_dir
# generate digest values for the lambda zips and append to txts
md5sum * >>$other_dist_dir/md5.txt
sha1sum * >>$other_dist_dir/sha1.txt
sha256sum * >>$other_dist_dir/sha256.txt

echo
echo ------------------------------------
echo Finished
echo ------------------------------------
echo
