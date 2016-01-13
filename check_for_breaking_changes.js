var fs = require('fs');

var breakingChanges = require('./lib/breaking_changes.js')()

var oldSwagger = JSON.parse(fs.readFileSync(process.argv[2], 'UTF-8'));
var newSwagger = JSON.parse(fs.readFileSync(process.argv[3], 'UTF-8'));

function checkPaths(oldSwagger,newSwagger){
    function getPathList(swagger){
        var pathList = [];
        _.forEach(swagger.paths, function(api, path){
            pathList.push(path);
        });

        return pathList;
    }

    console.log(breakingChanges.getRemovedPaths(oldSwagger,newSwagger));

    console.log(breakingChanges.getNewPaths(oldSwagger,newSwagger));


}

checkPaths(oldSwagger, newSwagger);
