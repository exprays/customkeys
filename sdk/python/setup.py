from setuptools import setup, find_packages

setup(
    name="customkeys-sdk",
    version="2.0.0",
    description="Official Python SDK for CustomKeys secrets manager",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[],
    extras_require={
        "websocket": ["websocket-client>=1.7.0"],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
)