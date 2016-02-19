
#usage tagRelease.sh <repo> <githubkey>

export SDK_VERSION=$(node node_modules/purecloud-api-sdk-common/print_version.js version.json)

export CHANGE_NOTES=$(node node_modules/purecloud-api-sdk-common/print_version_changelog.js version.json $SDK_VERSION)

node node_modules/purecloud-api-sdk-common/create_release.js /version=$SDK_VERSION /repo=$1 /token=$2 /releasenotes="$CHANGE_NOTES"
