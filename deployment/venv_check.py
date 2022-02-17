#!/usr/bin/env python3
"""
This program returns 0 if the current environment is a virtual environment.
"""
import sys

# compare the python prefixes, same == not venv
in_venv = (getattr(sys, "base_prefix", None) or getattr(
    sys, "real_prefix", None) or sys.prefix) != sys.prefix
# return success (0) if in a venv
sys.exit(in_venv == False)
