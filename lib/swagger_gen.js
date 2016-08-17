var purecloud = require('purecloud_api_sdk_javascript');
var _ = require('lodash');
var fs = require('fs');
var wget = require('wget');
var Q = require("q");
var http = require('https');

module.exports = function(){

    var API_VERSION = process.env.API_VERSION || "/api/v2/";
    var CLIENT_ID = process.env.CLIENT_ID;
    var CLIENT_SECRET = process.env.CLIENT_SECRET;
    var operationIds = [];
    var notificationDefinitions = {};

    function processSwagger(swagger){
        operationIds = [];

        console.log("processing swagger file");

        _.forEach(swagger.paths, function(api, path){
            _.forEach(api, function(operation, httpMethod){
                operation.operationId = operation['x-inin-method-name'];
            });
        });

        return removeUnusedModelDefinitions(swagger)
    }

    function removeUnusedModelDefinitions(swagger){
        var modelNames = [];

        function findSubModels(modelName){
            if(modelNames.indexOf(modelName) == -1){
                modelNames.push(modelName);
            }else{
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

                    if(property.additionalProperties && property.additionalProperties["$ref"]){
                        findSubModels(property.additionalProperties["$ref"].replace('#/definitions/', ''));
                    }

                    if(property.additionalProperties && property.additionalProperties.items && property.additionalProperties.items["$ref"]){
                        findSubModels(property.additionalProperties.items["$ref"].replace('#/definitions/', ''));
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


        _.forEach(swagger.definitions, function(def,key){
            if(modelNames.indexOf(key) == -1){
                delete swagger.definitions[key];
            }
        });

        return swagger;
    }

    function getEnvironmentHost(environmentParam) {
        if(!environmentParam || environmentParam.indexOf("https") == -1){
            var environment = "mypurecloud.com";

            if (environmentParam){
                environment = environmentParam;
            }
            return environment;
        }else{
            var hostRegex = /https:\/\/(.*.com)\//g;
            console.log(hostRegex)
            console.log(environmentParam)
            var match = hostRegex.exec(environmentParam);
            console.log(match)
            return match[1];
        }
    }

    function downloadSwaggerFileImpl(environmentParam, callback){

        var options ={};
        var environment = getEnvironmentHost(environmentParam);


        if(!environmentParam || environmentParam.indexOf("https") == -1){
            options = {
              host: 'api.' + environment,
              port: 443,
              path: API_VERSION + "docs/swagger"
            };
        }else{
            var hostRegex = /https:\/\/(.*.com)\//g;
            options = {
              host: environment,
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

    function addNotificationsToSwaggerImpl(swagger, environmentParam) {
        var deferred = Q.defer();

        if (!CLIENT_ID || !CLIENT_SECRET) {
            var message = '[ERROR] Client ID or secret was not set! Unable to add notification topics!';
            console.log(message);
            return deferred.promise;
            deferred.reject(new Error(message));
        }

        var environment = getEnvironmentHost(environmentParam);
        var pureCloudSession = purecloud.PureCloudSession({
            strategy: 'client-credentials',
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            environment: environment
        });

        console.log('[NOTIFICATIONS] logging in to ' + environment);
        pureCloudSession.login().then(function() {
            try {
                console.log('[NOTIFICATIONS] getting notifications')
                var api = new purecloud.NotificationsApi(pureCloudSession);
                api.getAvailabletopics(['schema'])
                    .then(function(result) {
                        return result;
                    })
                    .then(function(notifications) {
                        try {
                            console.log('[NOTIFICATIONS] processing notifications')
                            var notificationMappings = {};

                            // Process schemas
                            for (var i=0; i<notifications.entities.length; i++) {
                                var entity = notifications.entities[i];
                                var schemaIdArray = entity.schema.id.split(':');
                                var schemaName = schemaIdArray[schemaIdArray.length - 1] + 'Notification';
                                console.log('Notification mapping: ' + entity.id + ' (' + schemaName + ')');
                                notificationMappings[entity.id] = schemaName;
                                extractDefinitons(schemaName, entity.schema);
                            }

                            // Fix references (make standard JSON Pointers instead of URI)
                            Object.keys(notificationDefinitions).forEach(function(key, index) {
                                notificationDefinitions[key] = fixRefs(notificationDefinitions[key]);
                            });

                            // Add definitions to swagger
                            Object.keys(notificationDefinitions).forEach(function(key, index) {
                                var definition = notificationDefinitions[key];
                                swagger.definitions[definition.name] = definition.schema;
                            });

                            console.log('[NOTIFICATIONS] Notification processing complete')
                            deferred.resolve(swagger);
                        } catch (e) {
                            console.log(e);
                            deferred.reject(e);
                        }
                    })
                    .catch(function(e){
                        console.log(e);
                        deferred.reject(e);
                    });
            } catch (e) {
                console.log(e);
                deferred.reject(e);
            }
        })
        .catch(function(e){
            console.log(e);
            deferred.reject(e);
        });

        return deferred.promise;
    }

    function extractDefinitons(schemaName, entity) {
        try {
            Object.keys(entity).forEach(function(key, index) {
                var property = entity[key];

                if (key == 'id' && typeof(property) == 'string') {
                    var entityIdArray = entity.id.split(':');
                    var lastPart = entityIdArray[entityIdArray.length - 1];
                    var entityName = schemaName
                    if (schemaName != (lastPart + 'Notification')) {
                        entityName += lastPart;
                    }
                    notificationDefinitions[entity.id] = {
                        'name': entityName,
                        'schema': entity
                    };
                }

                if (typeof(property) == 'object') {
                    extractDefinitons(schemaName, property);
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    function fixRefs(entity) {
        // replace $ref values with "#/definitions/type" instead of uri
        try {
            Object.keys(entity).forEach(function(key, index) {
                //console.log('fixRefs>key: ' + key);
                var property = entity[key];
                if (key == '$ref' && !property.startsWith('#')) {
                    entity[key] = '#/definitions/' + notificationDefinitions[property].name;
                } else if (typeof(property) == 'object') {
                    entity[key] = fixRefs(property);
                }
            });
            return entity;
        } catch (e) {
            console.log(e);
        }
    }

    return {

        downloadSwaggerFile : function (environmentParam, callback){
            downloadSwaggerFileImpl(environmentParam, callback);
        },
        sanitizeSwagger: function (swagger){
            return processSwagger(swagger);
        },
        addNotificationsToSwagger: function(swagger, environmentParam) {
            return addNotificationsToSwaggerImpl(swagger, environmentParam);
        }
    };
}
