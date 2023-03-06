cdk_dir=$PWD # cdk directory
msam_dir="$cdk_dir/../msam" # msam source directory

echo "installing npm packages..."
npm install

echo "building core template via chalice..."
cd $msam_dir
chalice package ../cdk/dist

cd $cdk_dir

echo "renaming and cleaning up chalice output..."
cd dist
mv sam.json msam-core-release.template
rm deployment.zip
cd ..

echo 'pretest.sh finished'
