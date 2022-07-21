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
from test.test_layout import *
from test.test_nodes import *
from test.test_tags import *
from test.test_content import *
from test.test_notes import *
from test.test_settings import *
from test.test_periodic import *
# from test.test_app import *
from test.test_db import *

if __name__ == '__main__':
    unittest.main(verbosity=3)
