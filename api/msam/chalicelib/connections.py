# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
"""
This is the file contains helper functions for building the connection cache.
"""

import json
import os
import re
import time
from urllib.parse import urlparse

from botocore.exceptions import ClientError
from fuzzywuzzy import fuzz
from jsonpath_ng import parse

from chalicelib import cache
from chalicelib import content

# TTL provided via CloudFormation
CACHE_ITEM_TTL = int(os.environ["CACHE_ITEM_TTL"])


def connection_to_ddb_item(from_arn, to_arn, service, config):
    """
    Structure a discovered connection into a cache item.
    """
    now = int(time.time())
    item = {
        "arn": "{}:{}".format(from_arn, to_arn),
        "from": from_arn,
        "to": to_arn,
        "region": "global",
        "service": service,
        "updated": now,
        "expires": now + CACHE_ITEM_TTL,
        "data": json.dumps(config, default=str)
    }
    return item


def update_connection_ddb_items():
    """
    Update all connections in the cache.
    """
    try:
        content.put_ddb_items(medialive_channel_mediapackage_channel_ddb_items())
        content.put_ddb_items(medialive_channel_mediastore_container_ddb_items())
        content.put_ddb_items(mediastore_container_medialive_input_ddb_items())
        content.put_ddb_items(medialive_input_medialive_channel_ddb_items())
        content.put_ddb_items(mediapackage_channel_mediapackage_endpoint_ddb_items())
        content.put_ddb_items(s3_bucket_cloudfront_distribution_ddb_items())
        content.put_ddb_items(s3_bucket_medialive_input_ddb_items())
        content.put_ddb_items(cloudfront_distribution_medialive_input_ddb_items())
        content.put_ddb_items(mediapackage_endpoint_cloudfront_distribution_by_tag_ddb_items())
        content.put_ddb_items(mediapackage_endpoint_cloudfront_distribution_by_origin_url_ddb_items())
        content.put_ddb_items(mediapackage_endpoint_speke_keyserver_ddb_items())
    except ClientError as error:
        print(error)


def mediastore_container_medialive_input_ddb_items():
    """
    Identify and format MediaStore container to MediaLive input connections for cache storage.
    """
    items = []
    try:
        # get medialive inputs
        medialive_in_cached = cache.cached_by_service("medialive-input")
        # get mediastore containers
        mediastore_con_cached = cache.cached_by_service("mediastore-container")
        # check the inputs that pull from mediastore containers
        for ml_input in medialive_in_cached:
            ml_input_data = json.loads(ml_input["data"])
            for source in ml_input_data["Sources"]:
                ml_url = source["Url"]
                parsed_source = urlparse(ml_url)
                if "mediastore" in parsed_source.netloc:
                    for ms_container in mediastore_con_cached:
                        container_data = json.loads(ms_container["data"])
                        parsed_endpoint = urlparse(container_data["Endpoint"])
                        if parsed_source.netloc == parsed_endpoint.netloc:
                            # create a 'connection' out of matches
                            config = {"from": container_data["ARN"], "to": ml_input_data["Arn"], "scheme": parsed_source.scheme}
                            print(config)
                            items.append(connection_to_ddb_item(container_data["ARN"], ml_input_data["Arn"], "mediastore-container-medialive-input", config))
    except ClientError as error:
        print(error)
    return items


def medialive_channel_mediapackage_channel_ddb_items():
    """
    Identify and format MediaLive to MediaPackage channel connections for cache storage.
    """
    items = []
    try:
        # get medialive channels
        medialive_ch_cached = cache.cached_by_service("medialive-channel")
        # get mediapackage channels
        mediapackage_ch_cached = cache.cached_by_service("mediapackage-channel")
        # compare each medialive output url to a mediapackage ingest url
        for ml_channel in medialive_ch_cached:
            ml_channel_data = json.loads(ml_channel["data"])
            for destination in ml_channel_data["Destinations"]:
                for setting in destination["Settings"]:
                    ml_url = setting["Url"]
                    # convert a mediapackage v1 ingest url to a v2 url before
                    # checking
                    parsed = urlparse(ml_url)
                    if parsed.path.startswith("/in/v1/"):
                        pieces = parsed.path.split("/")
                        if len(pieces) == 5:
                            ml_url = "{scheme}://{netloc}/in/v2/{uid}/{uid}/channel".format(scheme=parsed.scheme, netloc=parsed.netloc, uid=pieces[3])
                    for mp_channel in mediapackage_ch_cached:
                        mp_channel_data = json.loads(mp_channel["data"])
                        for ingest_endpoint in mp_channel_data["HlsIngest"]["IngestEndpoints"]:
                            if ml_url == ingest_endpoint["Url"]:
                                # create a 'connection' out of matches
                                config = {"from": ml_channel_data["Arn"], "to": mp_channel_data["Arn"], "pipeline": destination["Settings"].index(setting)}
                                print(config)
                                items.append(connection_to_ddb_item(ml_channel_data["Arn"], mp_channel_data["Arn"], "medialive-channel-mediapackage-channel", config))
    except ClientError as error:
        print(error)
    return items


def medialive_channel_mediastore_container_ddb_items():
    """
    Identify and format MediaLive channel to MediaStore container connections for cache storage.
    """
    items = []
    try:
        # get medialive channels
        medialive_ch_cached = cache.cached_by_service("medialive-channel")
        # get mediastore containers
        mediastore_con_cached = cache.cached_by_service("mediastore-container")
        # compare each medialive output url to a mediastore container endpoint
        # url
        for ml_channel in medialive_ch_cached:
            ml_channel_data = json.loads(ml_channel["data"])
            for destination in ml_channel_data["Destinations"]:
                for setting in destination["Settings"]:
                    ml_url = setting["Url"]
                    parsed_destination = urlparse(ml_url)
                    if "mediastore" in parsed_destination.netloc:
                        for ms_container in mediastore_con_cached:
                            container_data = json.loads(ms_container["data"])
                            parsed_endpoint = urlparse(container_data["Endpoint"])
                            if parsed_destination.netloc == parsed_endpoint.netloc:
                                # create a 'connection' out of matches
                                config = {"from": ml_channel_data["Arn"], "to": container_data["ARN"], "scheme": parsed_destination.scheme}
                                print(config)
                                items.append(connection_to_ddb_item(ml_channel_data["Arn"], container_data["ARN"], "medialive-channel-mediastore-container", config))
    except ClientError as error:
        print(error)
    return items


def medialive_input_medialive_channel_ddb_items():
    """
    Identify and format MediaLive input to MediaLive channel connections for cache storage.
    """
    items = []
    try:
        # get medialive channels
        medialive_ch_cached = cache.cached_by_service("medialive-channel")
        # get medialive inputs
        medialive_in_cached = cache.cached_by_service("medialive-input")
        # find matching ids in the attached inputs to attached channels
        for ml_channel in medialive_ch_cached:
            ml_channel_data = json.loads(ml_channel["data"])
            ml_channel_id = ml_channel_data["Id"]
            for ml_input in medialive_in_cached:
                ml_input_data = json.loads(ml_input["data"])
                for attached_id in ml_input_data["AttachedChannels"]:
                    if ml_channel_id == attached_id:
                        config = {"from": ml_input_data["Arn"], "to": ml_channel_data["Arn"], "type": ml_input_data["Type"]}
                        print(config)
                        items.append(connection_to_ddb_item(ml_input_data["Arn"], ml_channel_data["Arn"], "medialive-input-medialive-channel", config))
    except ClientError as error:
        print(error)
    return items


def mediapackage_channel_mediapackage_endpoint_ddb_items():
    """
    Identify and format MediaPackage channel to MediaPackage endpoint connections for cache storage.
    """
    items = []
    package_key = re.compile("^(.+)Package$")
    try:
        # get mediapackage channels
        mediapackage_ch_cached = cache.cached_by_service("mediapackage-channel")
        # get mediapackage endpoints
        mediapackage_ep_cached = cache.cached_by_service("mediapackage-origin-endpoint")
        # find matching ids in the attached inputs to attached channels
        for mp_channel in mediapackage_ch_cached:
            mp_channel_data = json.loads(mp_channel["data"])
            mp_channel_id = mp_channel_data["Id"]
            for mp_endpoint in mediapackage_ep_cached:
                mp_endpoint_data = json.loads(mp_endpoint["data"])
                mp_endpoint_channel_id = mp_endpoint_data["ChannelId"]
                if mp_channel_id == mp_endpoint_channel_id:
                    package_type = ""
                    for key in mp_endpoint_data.keys():
                        matcher = package_key.match(key)
                        if matcher:
                            package_type = matcher.group(1).upper()
                    config = {"from": mp_channel_data["Arn"], "to": mp_endpoint_data["Arn"], "package": package_type}
                    print(config)
                    items.append(connection_to_ddb_item(mp_channel_data["Arn"], mp_endpoint_data["Arn"], "mediapackage-channel-mediapackage-origin-endpoint", config))
    except ClientError as error:
        print(error)
    return items


def s3_bucket_cloudfront_distribution_ddb_items():
    """
    Identify and format S3 Bucket to CloudFront Distribution connections for cache storage.
    """
    items = []
    s3_origin = re.compile(r"(\S+)\.s3\.amazonaws\.com")
    try:
        # get S3 buckets
        s3_buckets_cached = cache.cached_by_service("s3")
        # get CloudFront distributions
        cloudfront_dist_cached = cache.cached_by_service("cloudfront-distribution")
        for s3_bucket in s3_buckets_cached:
            s3_bucket_data = json.loads(s3_bucket["data"])
            for cloudfront_distro in cloudfront_dist_cached:
                cloudfront_distro_data = json.loads(cloudfront_distro["data"])
                for origin_item in cloudfront_distro_data["Origins"]["Items"]:
                    matcher = s3_origin.match(origin_item["DomainName"])
                    if matcher:
                        bucket_name = matcher.group(1)
                        if bucket_name == s3_bucket_data["Name"]:
                            config = {"from": s3_bucket["arn"], "to": cloudfront_distro["arn"], "label": "S3"}
                            print(config)
                            items.append(connection_to_ddb_item(s3_bucket["arn"], cloudfront_distro["arn"], "s3-bucket-cloudfront-distribution", config))
    except ClientError as error:
        print(error)
    return items


def s3_bucket_medialive_input_ddb_items():
    """
    Identify and format S3 Bucket to MediaLive Input connections for cache storage.
    """
    items = []
    s3_url_expressions = [re.compile(r"http.?\:\/\/(\S+)\.s3\-website.+"), re.compile(r"http.?\:\/\/s3\-\S+\.amazonaws\.com\/([^\/]+)\/.+"), re.compile(r"http.?\:\/\/(\S+)\.s3\.amazonaws\.com\/.+")]
    try:
        # get S3 buckets
        s3_buckets_cached = cache.cached_by_service("s3")
        # get MediaLive inputs
        medialive_in_cached = cache.cached_by_service("medialive-input")
        # iterate over all inputs
        for ml_input in medialive_in_cached:
            ml_input_data = json.loads(ml_input["data"])
            for source in ml_input_data["Sources"]:
                bucket_name = None
                scheme = None
                # is this a bucket url?
                for expr in s3_url_expressions:
                    match = expr.match(source["Url"])
                    if match:
                        # yes
                        bucket_name = match.group(1)
                        scheme = urlparse(source["Url"]).scheme
                        break
                if bucket_name:
                    # find the bucket
                    for s3_bucket in s3_buckets_cached:
                        s3_bucket_data = json.loads(s3_bucket["data"])
                        if bucket_name == s3_bucket_data["Name"]:
                            config = {"from": s3_bucket["arn"], "to": ml_input["arn"], "scheme": scheme}
                            print(config)
                            items.append(connection_to_ddb_item(s3_bucket["arn"], ml_input["arn"], "s3-bucket-medialive-input", config))
    except ClientError as error:
        print(error)
    return items


def cloudfront_distribution_medialive_input_ddb_items():
    """
    Identify and format CloudFront Distribution to MediaLive Input connections for cache storage.
    """
    items = []
    cloudfront_url = re.compile(r"http.?\:\/\/(\S+\.cloudfront\.net)\/.*")
    try:
        # get CloudFront distros
        cloudfront_distros_cached = cache.cached_by_service("cloudfront-distribution")
        # get MediaLive inputs
        medialive_in_cached = cache.cached_by_service("medialive-input")
        # iterate over all inputs
        for ml_input in medialive_in_cached:
            ml_input_data = json.loads(ml_input["data"])
            for source in ml_input_data["Sources"]:
                domain_name = None
                scheme = None
                # is this a cloudfront url?
                match = cloudfront_url.match(source["Url"])
                if match:
                    # yes
                    domain_name = match.group(1)
                    scheme = urlparse(source["Url"]).scheme
                    # find the distribution
                    for distro in cloudfront_distros_cached:
                        distro_data = json.loads(distro["data"])
                        if domain_name == distro_data["DomainName"]:
                            config = {"from": distro["arn"], "to": ml_input["arn"], "scheme": scheme}
                            print(config)
                            items.append(connection_to_ddb_item(distro["arn"], ml_input["arn"], "cloudfront-distribution-medialive-input", config))
    except ClientError as error:
        print(error)
    return items


def mediapackage_endpoint_cloudfront_distribution_by_tag_ddb_items():
    """
    Identify and format MediaPackage origin endpoints to CloudFront Distributions by tags for cache storage.
    """
    items = []
    try:
        # get CloudFront distros
        cloudfront_distros_cached = cache.cached_by_service("cloudfront-distribution")
        # get MediaPackage channels
        mediapackage_ch_cached = cache.cached_by_service("mediapackage-channel")
        # get MediaPackage origin endpoints
        mediapackage_ep_cached = cache.cached_by_service("mediapackage-origin-endpoint")
        # iterate over all distributions
        for distro in cloudfront_distros_cached:
            distro_data = json.loads(distro["data"])
            for tag in distro_data["Tags"]["Items"]:
                if (tag["Key"] == "MP-Endpoint-ARN" or tag["Key"] == "mediapackage:cloudfront_assoc") and ":channels/" in tag["Value"]:
                    channel_arn = tag["Value"]
                    channel_id = None
                    # find the channel
                    for channel in mediapackage_ch_cached:
                        if channel_arn == channel["arn"]:
                            channel_data = json.loads(channel["data"])
                            channel_id = channel_data["Id"]
                            break
                    if channel_id:
                        # add a connection to each endpoint
                        for endpoint in mediapackage_ep_cached:
                            endpoint_data = json.loads(endpoint["data"])
                            if endpoint_data["ChannelId"] == channel_id:
                                config = {"from": endpoint["arn"], "to": distro["arn"], "scheme": urlparse(endpoint_data["Url"]).scheme, "connected_by": "tag", "tag": tag["Key"]}
                                print(config)
                                items.append(connection_to_ddb_item(endpoint["arn"], distro["arn"], "mediapackage-origin-endpoint-cloudfront-distribution", config))
    except ClientError as error:
        print(error)
    return items


def mediapackage_endpoint_cloudfront_distribution_by_origin_url_ddb_items():
    """
    Identify and format MediaPackage origin endpoints to CloudFront Distributions by tags for cache storage.
    """
    min_ratio = 80
    items = []
    try:
        # get CloudFront distros
        cloudfront_distros_cached = cache.cached_by_service("cloudfront-distribution")
        # get MediaPackage origin endpoints
        mediapackage_ep_cached = cache.cached_by_service("mediapackage-origin-endpoint")
        # iterate over all distributions
        for distro in cloudfront_distros_cached:
            distro_data = json.loads(distro["data"])
            for item in distro_data["Origins"]["Items"]:
                origin_partial_url = "{}/{}".format(item["DomainName"], item["OriginPath"])
                for mp_endpoint in mediapackage_ep_cached:
                    mp_endpoint_data = json.loads(mp_endpoint["data"])
                    ratio = fuzz.ratio(origin_partial_url, mp_endpoint_data["Url"])
                    # print("{} {} :: {}".format(ratio, origin_partial_url, mp_endpoint_data["Url"]))
                    if ratio >= min_ratio:
                        config = {"from": mp_endpoint["arn"], "to": distro["arn"], "scheme": urlparse(mp_endpoint_data["Url"]).scheme, "connected_by": "url", "match": "{}%".format(ratio)}
                        print(config)
                        items.append(connection_to_ddb_item(mp_endpoint["arn"], distro["arn"], "mediapackage-origin-endpoint-cloudfront-distribution", config))
    except ClientError as error:
        print(error)
    return items


def mediapackage_endpoint_speke_keyserver_ddb_items():
    """
    Identify and format MediaPackage origin endpoints to SPEKE keyservers for cache storage.
    """
    items = []
    # create an expression to find speke server urls
    jsonpath_expr = parse('$..SpekeKeyProvider.Url')
    try:
        # get SPEKE keyservers
        speke_keyservers_cached = cache.cached_by_service("speke-keyserver")
        # get MediaPackage origin endpoints
        mediapackage_ep_cached = cache.cached_by_service("mediapackage-origin-endpoint")
        # iterate over all distributions
        for keyserver in speke_keyservers_cached:
            keyserver_data = json.loads(keyserver["data"])
            keyserver_endpoint = keyserver_data["endpoint"]
            for mp_endpoint in mediapackage_ep_cached:
                mp_endpoint_data = json.loads(mp_endpoint["data"])
                for server_url in [match.value for match in jsonpath_expr.find(mp_endpoint_data)]:
                    if server_url == keyserver_endpoint:
                        config = {"from": mp_endpoint["arn"], "to": keyserver["arn"], "scheme": keyserver_data["scheme"]}
                        print(config)
                        items.append(connection_to_ddb_item(mp_endpoint["arn"], keyserver["arn"], "mediapackage-origin-endpoint-speke-keyserver", config))
    except ClientError as error:
        print(error)
    return items
