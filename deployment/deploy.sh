#!/bin/bash

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

# local folders
template_dir="$PWD"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
other_dist_dir="$template_dir/assets"

# AWS default settings
BUCKET="rodeolabz"
REGIONS="ap-south-1 eu-west-3 eu-north-1 eu-west-2 eu-west-1 ap-northeast-2 ap-northeast-1 sa-east-1 ca-central-1 ap-southeast-1 ap-southeast-2 eu-central-1 us-east-1 us-east-2 us-west-1 us-west-2"
ACL="public-read"
DEPLOY_TYPE="dev"
SOLUTION_NAME="aws-media-services-application-mapper"
VERSION="v1.0.0"

while getopts 'a:b:p:r:s:t:v:h' OPTION; do
  case "$OPTION" in
    b)
      BUCKET="$OPTARG"
      ;;
    r)
      REGIONS="$OPTARG"
      ;;
    p)
      DEPLOY_PROFILE="$OPTARG"
      ;;
    a)
      ACL="$OPTARG"
      ;;
    t)
      DEPLOY_TYPE="$OPTARG"
      ;;
    s)
      SOLUTION_NAME="$OPTARG"
      ;;
    v)
      VERSION="$OPTARG"
      ;;
    h)
      echo
      echo "script usage: $(basename $0) [-b BucketBasename] [-s SolutionName] [-v VersionString] [-r RegionsForDeploy] [-a ACLSettings(public-read|none)] [-t DeployType(dev|release)]" >&2
      echo "example usage: ./$(basename $0) -b mybucket -s aws-media-services-application-mapper -v v1.8.0 -r \"us-west-2 us-east-1\" -a public-read -t dev" >&2
      echo
      exit 1
      ;;
    ?)
      echo "script usage: $(basename $0) [-b BucketBasename] [-s SolutionName] [-v VersionString] [-r RegionsForDeploy] [-a ACLSettings(public-read|none)] [-t DeployType(dev|release)]" >&2
      exit 1
      ;;
  esac
done
shift "$(($OPTIND -1))"

echo Bucket Basename = $BUCKET
echo Regions = $REGIONS
echo ACL Setting = $ACL
echo Deploy Type = $DEPLOY_TYPE

# Get account id
account_id=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
  msg "ERROR: Failed to get AWS account ID"
  exit 1
fi

for R in $REGIONS; do 
  # Validate ownership of $BUCKET-$R
  aws s3api head-bucket --bucket $BUCKET-$R --expected-bucket-owner $account_id
  if [ $? -ne 0 ]; then
    msg "ERROR: Your AWS account does not own s3://$BUCKET-$R/"
    exit 1
  fi
  if [ "$ACL" = "public-read" ]; then
      aws s3 sync $template_dist_dir/ s3://$BUCKET-$R/$SOLUTION_NAME/$VERSION --exclude "*release.template" --acl public-read --storage-class INTELLIGENT_TIERING
      aws s3 sync $build_dist_dir/ s3://$BUCKET-$R/$SOLUTION_NAME/$VERSION --acl public-read  --storage-class INTELLIGENT_TIERING    
      aws s3 sync $other_dist_dir/ s3://$BUCKET-$R/$SOLUTION_NAME/$VERSION --acl public-read  --storage-class INTELLIGENT_TIERING    
  else
      aws s3 sync $template_dist_dir/ s3://$BUCKET-$R/$SOLUTION_NAME/$VERSION --exclude "*release.template"  --storage-class INTELLIGENT_TIERING
      aws s3 sync $build_dist_dir/ s3://$BUCKET-$R/$SOLUTION_NAME/$VERSION  --storage-class INTELLIGENT_TIERING
      aws s3 sync $other_dist_dir/ s3://$BUCKET-$R/$SOLUTION_NAME/$VERSION  --storage-class INTELLIGENT_TIERING
  fi

  if [ "$DEPLOY_TYPE" = "release" ]; then
     aws s3 sync $template_dist_dir/ s3://$BUCKET-$R/$SOLUTION_NAME/latest --exclude "*" --include "*release.template" --acl public-read  --storage-class INTELLIGENT_TIERING
      echo
      echo "ROOT TEMPLATE WEB LOCATION: https://$BUCKET-$R.s3-$R.amazonaws.com/$SOLUTION_NAME/latest/aws-media-services-application-mapper-release.template"
  else
      cd $template_dist_dir
      root_template="$( ls aws-media-services-application-mapper-release-[0-9]*.template )"
      echo
      echo "ROOT TEMPLATE WEB LOCATION: https://$BUCKET-$R.s3-$R.amazonaws.com/$SOLUTION_NAME/$VERSION/$root_template"
  fi
done
