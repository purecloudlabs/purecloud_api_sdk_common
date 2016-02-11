#!/bin/bash

if [ -f $WORKSPACE/repo/newVersion.md ]; then
    git add .
    git commit -m 'updating from build, version'
fi
