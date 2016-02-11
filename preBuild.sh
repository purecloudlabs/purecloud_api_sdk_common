#!/bin/bash
rm -f newVersion.md

#get version details
npm install git://github.com/MyPureCloud/purecloud_api_sdk_common.git

node node_modules/purecloud-api-sdk-common/updateSwaggerAndVersionFiles.js swagger.json version.json
export SDK_VERSION=$(node node_modules/purecloud-api-sdk-common/print_version.js version.json)
export CHANGE_NOTES=$(node node_modules/purecloud-api-sdk-common/print_version_changelog.js version.json $SDK_VERSION)
