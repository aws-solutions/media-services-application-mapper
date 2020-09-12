"""
This custom resource is responsible for issuing an
invalidation to CloudFront after the web content is changed.
"""

import logging
import time

import boto3
from crhelper import CfnResource

logger = logging.getLogger(__name__)
helper = CfnResource()


@helper.create
@helper.update
def create_update(event, _):
    """
    This function issues an invalidation command to CloudFront.
    """
    distribution_id = event['ResourceProperties']['DistributionId']
    cloudfront = boto3.client("cloudfront")
    response = cloudfront.create_invalidation(DistributionId=distribution_id,
                                              InvalidationBatch={
                                                  'Paths': {
                                                      'Quantity': 1,
                                                      'Items': [
                                                          '/*',
                                                      ]
                                                  },
                                                  'CallerReference':
                                                  str(int(time.time()))
                                              })
    logger.info(response)


def handler(event, context):
    """
    This is the Lambda custom resource entry point.
    """
    helper(event, context)
