#!/bin/sh

export SOURCE_API_KEY="x-api-key:nWT7T5OL9c8v4zy2SwKke3QX7bg5eWmw9V3hC9KD"
export SOURCE_URL="https://n5gjy8mbvg.execute-api.ap-southeast-1.amazonaws.com/msam/cached"

export TARGET_API_KEY="x-api-key:hAlnXtEPme250S5fhLjrN4Bdj4MEIeeW4vtt3A72"
export TARGET_URL="https://w17k5gc3eb.execute-api.us-west-2.amazonaws.com/msam/cached"

# ap-southeast-1
http -b $SOURCE_URL/medialive-input/ap-southeast-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/medialive-channel/ap-southeast-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/mediapackage-channel/ap-southeast-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/mediapackage-origin-endpoint/ap-southeast-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/mediastore-container/ap-southeast-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30

# us-east-1
http -b $SOURCE_URL/medialive-input/us-east-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/medialive-channel/us-east-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/mediapackage-channel/us-east-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/mediapackage-origin-endpoint/us-east-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/mediastore-container/us-east-1 $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30

# global
http -b $SOURCE_URL/cloudfront-distribution/global $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
sleep 30
http -b $SOURCE_URL/medialive-input/global $SOURCE_API_KEY | http POST $TARGET_URL $TARGET_API_KEY
