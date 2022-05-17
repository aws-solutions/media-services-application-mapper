#!/usr/bin/env python3
"""
This program returns 0 if the current environment is a virtual environment.
"""

import argparse
import os


def main():
    parser = argparse.ArgumentParser(description="""Reduce a folder's contents to only those in a file list""")
    parser.add_argument('--file',
                        required=True,
                        help='retain files and folders in this file')
    parser.add_argument('--folder',
                        required=True,
                        help='target folder to reduce')
    parser.add_argument('--execute',
                        action='store_true',
                        help='required, otherwise do a dryrun')
    parser.add_argument('--verbose',
                        action='store_true',
                        help='detailed output')

    args = parser.parse_args()

    if os.path.isfile(args.file) and os.path.isdir(args.folder):
        with open(args.file, 'rt') as file:
            retain_files = file.read().replace('\n', '')
        for dirpath, _, filenames in os.walk(args.folder):
            for name in filenames:
                absfilename = f"{dirpath}/{name}"
                if absfilename in retain_files:
                    if args.verbose:
                        print(f"keep file: {absfilename}")
                else:
                    if args.verbose:
                        print(f"remove file: {absfilename}")
                    if args.execute:
                        os.remove(absfilename)


if __name__ == "__main__":
    main()
