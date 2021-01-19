# coding: utf-8

from setuptools import setup, find_packages
try: # for pip >= 10
    from pip._internal.req import parse_requirements
except ImportError: # for pip <= 9.0.3
    from pip.req import parse_requirements
    
setup(
    name='example_function',
    version='1.0',
    description='Example Function',
    author='AWS Solutions Builders',
    license='ASL',
    zip_safe=False,
    packages=['example_function'],
    package_dir={'example_function': '.'},
    include_package_data=False,
    install_requires=[
        'example_function==1.0'
    ],
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
)
