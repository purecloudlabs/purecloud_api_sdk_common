
var _ = require('lodash');
var fs = require('fs');
var wget = require('wget');
var Q = require("q");
var http = require('https');

module.exports = function(){

    var API_VERSION = process.env.API_VERSION || "/api/v1/";
    var operationIds = [];

    function processSwagger(swagger){
        operationIds = [];

        console.log("processing swagger file");

        _.forEach(swagger.paths, function(api, path){
            _.forEach(api, function(operation, httpMethod){
                operation.operationId = operation['x-inin-method-name'];
            });
        });

        return swagger;
    }

    function downloadSwaggerFileImpl(environmentParam, callback){
        var environment = "mypurecloud.com";
        if (environmentParam){
            environment = environmentParam;
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
