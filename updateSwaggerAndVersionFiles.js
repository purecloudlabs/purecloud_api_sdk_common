/***********
This script will
-download the latest swagger definition
-do any cleanup on it that is required by the client library generators
-update a version file for any versioning changes

node updateSwaggerAndVersionFiles <oldswaggerfilepath> <versionfilepath> <environment (default mypurecloud.com)>

***********/
var fs = require('fs');

const SWAGGER_FILE_PATH_INDEX = 2;
const VERSION_FILE_PATH_INDEX = 3;
const ENVIRONMENT_INDEX = 4;

if (process.argv.length <= VERSION_FILE_PATH_INDEX){
    console.log("USAGE: node updateSwaggerAndVersionFiles <oldswaggerfilepath> <versionfilepath> <environment (default mypurecloud.com)>");
    process.exit(1);
}

var pclib = require('./lib/app.js');
var pclibSwaggerVersion = pclib.swaggerVersioning();

var environment = "mypurecloud.com";
if (process.argv.length <= ENVIRONMENT_INDEX){
    environment = process.argv[ENVIRONMENT_INDEX];
}

pclib.updateSwaggerAndVersion(process.argv[SWAGGER_FILE_PATH_INDEX], process.argv[VERSION_FILE_PATH_INDEX], environment, function(hasChanges){
        var version = pclibSwaggerVersion.getVersionString(process.argv[VERSION_FILE_PATH_INDEX]);

        if(hasChanges){
            console.log("has changes, new version: " + version)
            fs.writeFileSync("newVersion.md", version);
        }else{
            console.log("no changes, still version " + version)
        }
    });
