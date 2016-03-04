var fs = require('fs');

const SWAGGER_FILE_PATH_INDEX = 2;
const ENVIRONMENT_INDEX = 3;

if (process.argv.length <= SWAGGER_FILE_PATH_INDEX){
    console.log("USAGE: node downloadAndSanitizeSwagger <swaggerfilepath> <environment (default mypurecloud.com)>");
    process.exit(1);
}

var pclib = require('./lib/app.js');
var pcSwaggerGen = pclib.swaggerGen();
var environment = "mypurecloud.com";

if (process.argv.length >= ENVIRONMENT_INDEX){
    environment = process.argv[ENVIRONMENT_INDEX];
}

pcSwaggerGen.downloadSwaggerFile(environment, function(swagger){
    pcSwaggerGen.sanitizeSwagger(swagger, function(cleanSwagger){
        fs.writeFileSync(process.argv[SWAGGER_FILE_PATH_INDEX], JSON.stringify(newSwagger));
    } );
});
