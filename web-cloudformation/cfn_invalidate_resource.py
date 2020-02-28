from crhelper import CfnResource
import logging
import time
import boto3

logger = logging.getLogger(__name__)
helper = CfnResource()


@helper.create
@helper.update
def create_update(event, context):
    logger.info(event)
    try:
        distribution_id = event['ResourceProperties']['DistributionId']
        cloudfront = boto3.client("cloudfront")
        response = cloudfront.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 1,
                    'Items': [
                        '/*',
                    ]
                },
                'CallerReference': str(int(time.time()))
            })
        logger.info(response)
    except Exception as exception:
        logger.error(exception)


@helper.delete
def delete(event, context):
    logger.info(event)


def handler(event, context):
    helper(event, context)
