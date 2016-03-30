
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

        return swagger;
    }

    function downloadSwaggerFileImpl(environmentParam, callback){

        var options ={};


        if(environmentParam.indexOf("https") == -1){
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
