"""
Launch from the source/msam/ folder:
python -m chalicelib.run_unit_tests

"""
import unittest

# pylint: disable=W0611
from chalicelib.test_cache import TestCache
from chalicelib.test_channels import TestChannels
from chalicelib.test_cloudwatch import TestCloudWatch

if __name__ == '__main__':
    unittest.main()
