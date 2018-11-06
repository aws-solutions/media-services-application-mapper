# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
"""
This is the file contains helper functions for building the connection cache.
"""

import json
import os
import time
from urllib.parse import urlparse

from botocore.exceptions import ClientError

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
