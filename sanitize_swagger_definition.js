/***********
This script will download the latest swagger definition and do any cleanup on it that is required by the client library generators

node sanitize_swagger_definition <output file> <environment (default mypurecloud.com)> <version>

***********/

if (process.argv.length <= OUTPUT_INDEX){
    console.log("output file requred");
    process.exit(1);
}

var _ = require('lodash');
var fs = require('fs');
var wget = require('wget');
var Q = require("q");
var http = require('https');

const API_VERSION = "/api/v1/";
const OUTPUT_INDEX = 2;
const ENVIRONMENT_INDEX = 3;
const VERSION_INDEX = 4;
var swagger= {};
var operationIds = [];

function getHttpMethodOperationText(httpMethod){
    if(httpMethod.toLowerCase() == 'post'){
        httpMethod = "create";
    }
    else if(httpMethod.toLowerCase() == 'put'){
        httpMethod = "update";
    }
    else{
        httpMethod = httpMethod.charAt(0).toLowerCase() + httpMethod.substr(1);
    }

    return httpMethod;
}

function generateMethodNameFromPathAndMethodOperation(operation, path, method){

    var segments = path.replace(API_VERSION, '').split("/");

    var idParam = '';
    var firstMatch = true;
    for(var x=0; x< segments.length; x++){

        if(segments[x].match(/\{([A-Za-z]*)\}/g)){
            if(firstMatch){
                segments[x] = RegExp.$1.replace(/id/i,'');
                //handle the case where the param name is just Id
                if(segments[x] === ''){
                    segments[x] = 'Id';
                }
                firstMatch = false;
            }else{

                segments[x] = "By" + RegExp.$1.charAt(0).toUpperCase() + RegExp.$1.substr(1);
            }
        }
        segments[x] = segments[x].charAt(0).toUpperCase() + segments[x].substr(1);
        segments[x] = segments[x].replace(/[^_a-zA-Z0-9]/g,'');

    }

    var lastPop = segments.shift();
    if(segments.length > 1){
    //    lastPop = segments.shift();
    }

    var newOpId = method + segments.join('');

    //make sure that this isn't a duplicate method per a tag
    for(var t=0; t <operation.tags.length; t++){

        var taggedValue = operation.tags[t] + newOpId;

        //add the tag back in if needed
        var firstTag = operation.tags[0].replace(/ /g, "");
        if(operationIds.indexOf(taggedValue) > -1){

            newOpId = method + lastPop +  segments.join('');
            taggedValue = operation.tags[t] + newOpId;

        }

        if(operationIds.indexOf(newOpId) > -1){
            console.error(newOpId + " already exists! ");
            process.exit(1);
        }

        operationIds.push(taggedValue);
        //if(newOpId.toLowerCase().indexOf( "getuser") > -1){
            console.log(operation.tags[t] + " " + newOpId);
        //}
    }

    return newOpId;
}

function processSwagger(){
    console.log("processing swagger file");
    //set version if defined
    if (process.argv.length > VERSION_INDEX){
        swagger.info.version = process.argv[VERSION_INDEX];
    }

    _.forEach(swagger.paths, function(api, path){
        _.forEach(api, function(operation, httpMethod){
            var operationTypeText = getHttpMethodOperationText(httpMethod);

            operation.operationId = generateMethodNameFromPathAndMethodOperation(operation, path, operationTypeText);
        });
    });

    fs.writeFileSync(process.argv[OUTPUT_INDEX], JSON.stringify(swagger, null, "  "), 'utf8');
    console.log("done, file saved to " + process.argv[OUTPUT_INDEX]);
}

function downloadSwaggerFile(){

    var deferred = Q.defer();

    var environment = "mypurecloud.com";
    if (process.argv.length > ENVIRONMENT_INDEX){
        environment = process.argv[ENVIRONMENT_INDEX];
    }

    var options = {
      host: 'api.' + environment,
      port: 443,
      path: API_VERSION + "docs/swagger"
    };

    console.log("downloading swagger from " + options.host + options.path);

    var body = '';
    http.get(options, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            swagger = JSON.parse(body);
            deferred.resolve();
        });
    });

    return deferred.promise;

}

downloadSwaggerFile().then(processSwagger);
