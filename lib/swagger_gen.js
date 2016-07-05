
var _ = require('lodash');
var fs = require('fs');
var wget = require('wget');
var Q = require("q");
var http = require('https');

module.exports = function(){

    var API_VERSION = process.env.API_VERSION || "/api/v2/";
    var operationIds = [];

    function processSwagger(swagger){
        operationIds = [];

        console.log("processing swagger file");

        _.forEach(swagger.paths, function(api, path){
            _.forEach(api, function(operation, httpMethod){
                operation.operationId = operation['x-inin-method-name'];
            });
        });

        return removeUnusedModelDefinitions(swagger);
    }

    function removeUnusedModelDefinitions(swagger){
        var modelNames = [];

        function findSubModels(modelName){
            console.log("find sub models for " + modelName);
            if(modelNames.indexOf(modelName) == -1){
                console.log("adding " + modelName);
                modelNames.push(modelName);
            }else{
                console.log("already processed");
                return; //Don't need to reprocess model
            }

            var model = swagger.definitions[modelName];
            if(model.properties){
                _.forEach(model.properties, function(property){
                    if(property["$ref"]){
                        findSubModels(property["$ref"].replace('#/definitions/', ''));
                    }

                    if(property.items && property.items["$ref"]){
                        findSubModels(property.items["$ref"].replace('#/definitions/', ''));
                    }
                });
            }


        }

        _.forEach(swagger.paths, function(api, path){
            _.forEach(api, function(operation, httpMethod){
                if(operation.parameters){
                    _.forEach(operation.parameters, function(parameter){
                        if(parameter.schema && parameter.schema["$ref"]){
                            findSubModels(parameter.schema["$ref"].replace('#/definitions/', ''));
                        }

                        if(parameter.schema && parameter.schema.items && parameter.schema.items["$ref"]){
                            findSubModels(parameter.schema.items["$ref"].replace('#/definitions/', ''));
                        }
                    });
                }


                _.forEach(operation.responses, function(response, code){
                    if(response.schema && response.schema["$ref"]){
                        findSubModels(response.schema["$ref"].replace('#/definitions/', ''));
                    }

                    if(response.schema && response.schema.items && response.schema.items["$ref"]){
                        findSubModels(response.schema.items["$ref"].replace('#/definitions/', ''));
                    }
                });

            });
        });


        console.log("REMOVE TEST");
        console.log(swagger.definitions);
        _.forEach(swagger.definitions, function(def,key){
            console.log(key)
            if(modelNames.indexOf(key) == -1){
                delete swagger.definitions[key];
            }
        });

        return swagger;
    }

    function downloadSwaggerFileImpl(environmentParam, callback){

        var options ={};


        if(!environmentParam || environmentParam.indexOf("https") == -1){
            var environment = "mypurecloud.com";

            if (environmentParam){
                environment = environmentParam;
            }

            options = {
              host: 'api.' + environment,
              port: 443,
              path: API_VERSION + "docs/swagger"
            };
        }else{
            var hostRegex = /https:\/\/(.*.com)\//g;
            console.log(hostRegex)
            console.log(environmentParam)
            var match = hostRegex.exec(environmentParam);
            console.log(match)
            options = {
              host: match[1],
              port: 443,
              path: '/' + environmentParam.replace(hostRegex, '')
            };
        }


        console.log("downloading swagger from " + options.host + options.path);

        var body = '';
        http.get(options, function(response) {
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
            response.on('end', function() {
                console.log("swagger get correlation id: " + response.headers['inin-correlation-id']);

                swagger = JSON.parse(body);
                callback(swagger);
            });
        });
    }

    return {

        downloadSwaggerFile : function (environmentParam, callback){
            downloadSwaggerFileImpl(environmentParam, callback);
        },
        sanitizeSwagger: function (swagger){
            return processSwagger(swagger);
        }
    };
}
