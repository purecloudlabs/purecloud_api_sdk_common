#!/bin/bash

if [ -f $WORKSPACE/repo/newVersion.md ]; then
    git add .
    git commit -m 'updating from build, version $SDK_VERSION'
    git tag -l $SDK_VERSION
    git tag -a -m 'release from build server' $SDK_VERSION
fi
