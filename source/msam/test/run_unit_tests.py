"""
Launch from the source/msam/ folder:
python -m test.run_unit_tests

"""
import unittest

# pylint: disable=W0611,E0611
from test.test_cache import *
from test.test_channels import *
from test.test_cloudwatch import *
from test.test_connections import *

if __name__ == '__main__':
    unittest.main(verbosity=3)
