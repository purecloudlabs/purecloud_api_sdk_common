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

var versioning = require('./lib/swagger_versioning.js')();
var gen = require('./lib/swagger_gen.js')();

var oldSwagger = JSON.parse(fs.readFileSync(process.argv[SWAGGER_FILE_PATH_INDEX], 'UTF-8'));

var environment = "mypurecloud.com";
if (process.argv.length <= ENVIRONMENT_INDEX){
    environment = process.argv[ENVIRONMENT_INDEX];
}

gen.downloadSwaggerFile(environment, function(swagger){

    var newSwagger = gen.sanitizeSwagger(swagger);

    var swaggerDifferences = versioning.checkAll(oldSwagger, newSwagger);

    var hasChanges = versioning.updateVersionFile(swaggerDifferences, process.argv[VERSION_FILE_PATH_INDEX]);
    
    if(hasChanges){
        fs.writeFileSync(process.argv[SWAGGER_FILE_PATH_INDEX], JSON.stringify(newSwagger));
    }
});
