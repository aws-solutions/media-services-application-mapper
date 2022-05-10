"""
Launch from the source/msam/ folder:
python -m chalicelib.run_unit_tests

"""
import unittest

# pylint: disable=W0611
from test.test_cache import TestCache
from test.test_channels import TestChannels
from test.test_cloudwatch import TestCloudWatch

if __name__ == '__main__':
    unittest.main(verbosity=3)
