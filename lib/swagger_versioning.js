//THIS NPM MODULE WILL COMPARE 2 SWAGGER DEFINITION OBJECTS TO SEE IF THERE ARE
//ANY MAJOR OR MINOR POINT CHANGES FOR CLIENT LIBRARIES GENERATED OFF OF THEM

var _ = require('lodash');
var fs = require('fs');

module.exports = function(){
    const MAJOR_CHANGE = "Major";
    const MINOR_CHANGE = "Minor";
    const POINT_CHANGE = "Point";

    function addBreakingError(breakingModels, key, text){
        if(!breakingModels[key]){
            breakingModels[key] = [];
        }

        breakingModels[key].push(text);
    }

    function getPathList(swagger){
        var pathList = [];
        _.forEach(swagger.paths, function(api, path){
            pathList.push(path);
        });

        return pathList;
    }

    function checkOperationsImpl(oldSwagger, newSwagger){

        var breakingPaths = {};

        _.forEach(oldSwagger.paths, function(oldPath, pathKey){
            if(newSwagger.paths[pathKey]){
                var newPath = newSwagger.paths[pathKey];

                if(_.difference(Object.keys(newPath), Object.keys(oldPath)).length > 0){
                    addBreakingError(breakingPaths, MINOR_CHANGE, "Operation added to " + oldPath);
                }

                _.forEach(oldPath, function(oldOperation, methodKey){
                    if(newPath[methodKey]){
                        var newOperation = newPath[methodKey];

                        if(oldOperation.operationId !== newOperation.operationId){
                            addBreakingError(breakingPaths, MAJOR_CHANGE, "Operation ID changed from " + oldOperation.operationId + " to " + newOperation.operationId);
                        }

                        if(oldOperation.description !== newOperation.description){
                            addBreakingError(breakingPaths, POINT_CHANGE, "Operation description changed " + oldOperation.operationId);
                        }

                        if(oldOperation.summary !== newOperation.summary){
                            addBreakingError(breakingPaths, POINT_CHANGE, "Operation summary changed " + oldOperation.operationId);
                        }

                        if(oldOperation.parameters.length !== newOperation.parameters.length){
                            addBreakingError(breakingPaths, MAJOR_CHANGE, "Parameter count for " + oldPath + " changed");
                        }else{
                            for(var paramIndex in oldOperation.parameters){
                                var oldParam = oldOperation.parameters[paramIndex];
                                var newParam = newOperation.parameters[paramIndex];

                                var paramProperties = [
                                    'name', 'in', 'required', 'type'
                                ];

                                for(var paramPropIndex=0; paramPropIndex< paramProperties.length; paramPropIndex++){
                                    var paramName = paramProperties[paramPropIndex];

                                    if(newParam[paramName] != oldParam[paramName]){
                                        addBreakingError(breakingPaths, MAJOR_CHANGE, paramName + " of parameter " + oldParam.name + " was changed from " + oldParam[paramName] + " to " + newParam[paramName]);
                                    }
                                }

                                if(oldParam.format && newParam.format != oldParam.format){
                                    addBreakingError(breakingPaths, MAJOR_CHANGE, "Format of parameter " + oldParam.name + " was changed from " + oldParam.format + " to " + newParam.format);
                                }

                            }
                        }

                        if(oldOperation.responses.length !== newOperation.responses.length){
                            addBreakingError(breakingPaths, MAJOR_CHANGE, "Response count for " + oldPath + " changed");
                        }else{
                            _.forEach(oldOperation.responses, function(oldResponse, responseCode){
                                if(!newOperation.responses[responseCode]){
                                    addBreakingError(breakingPaths, MAJOR_CHANGE, "Response " + responseCode + " was removed");
                                }else{
                                    var newResponse = newOperation.responses[responseCode];
                                    if(newResponse.description !== oldResponse.description){
                                        addBreakingError(breakingPaths, POINT_CHANGE, "Response description for " + pathKey + " changed");
                                    }

                                    if(oldResponse.schema && (!newResponse.schema ||  newResponse.schema["$ref"] !== oldResponse.schema["$ref"])){
                                        addBreakingError(breakingPaths, MAJOR_CHANGE, "Response type for " + pathKey + " changed");
                                    }
                                }
                            });
                        }

                        //checkTags
                        var oldOperationTags = oldOperation.tags;
                        var newOperationTags = newOperation.tags;

                        if(_.difference(oldOperationTags, newOperationTags).length !== 0){
                            //has removed paths
                            addBreakingError(breakingPaths, MAJOR_CHANGE, "Tag removed from " + pathKey);
                        }

                        if(_.difference(newOperationTags, oldOperationTags).length !== 0){
                            //has new paths
                            addBreakingError(breakingPaths, MINOR_CHANGE, "Tag added to " + pathKey);
                        }
                    }
                    else{
                        addBreakingError(breakingPaths, MAJOR_CHANGE, "Method  " + methodKey + " for " + pathKey + " does not exist");
                    }
                });


            }else{
                addBreakingError(breakingPaths, MAJOR_CHANGE, "Path " + pathKey + " is missing;");
            }
        });

        return breakingPaths;
    }

    function checkModelsImpl(oldSwagger, newSwagger){

        var breakingModels = {};

        _.forEach(oldSwagger.definitions, function(oldModel, key){

            if(newSwagger.definitions[key]){
                var newModel = newSwagger.definitions[key];

                _.forEach(oldModel.properties, function(oldProperty, propertyKey){
                    if(newModel.properties[propertyKey]){
                        var newProperty = newModel.properties[propertyKey];

                        if(newProperty.type != oldProperty.type){
                            addBreakingError(breakingModels, MAJOR_CHANGE, "Type " + propertyKey + " of model " + key + " was changed from " + oldProperty.type + " to " + newProperty.type);
                        }

                        if(oldProperty.format && newProperty.format != oldProperty.format){
                            addBreakingError(breakingModels, MAJOR_CHANGE, "Format " + propertyKey + " of model " + key + " was changed from " + oldProperty.format + " to " + newProperty.format);
                        }

                    }
                    else{
                        addBreakingError(breakingModels, MAJOR_CHANGE, "Property " + propertyKey + " of model " + key + " was removed");
                    }
                });

                _.forEach(newModel.properties, function(newProperty, propertyKey){
                    if(!oldModel.properties[propertyKey]){
                        addBreakingError(breakingModels, MINOR_CHANGE, "Property " + propertyKey + " of model " + key + " was added");
                    }
                });

            }else{
                addBreakingError(breakingModels, MAJOR_CHANGE, "Module Not Defined");
            }
        });

        //console.log(breakingModels);
        return breakingModels;
    }

    function checkPathsImpl(oldSwagger, newSwagger){
        var breaking = {};

        var removedPaths = _.difference(getPathList(oldSwagger), getPathList(newSwagger));
        var addedPaths =  _.difference(getPathList(newSwagger), getPathList(oldSwagger));

        if(removedPaths.length > 0){
            addBreakingError(breaking, MAJOR_CHANGE, "Paths removed " + JSON.stringify(removedPaths));
        }

        if(addedPaths.length > 0){
            addBreakingError(breaking, MINOR_CHANGE, "Paths added " + JSON.stringify(addedPaths));
        }

        return breaking;
    }

    function getVersionString(versionJson){
        return versionJson.major + versionJson.minor + versionJson.point;
    }

    return{
        checkPaths : function(oldSwagger, newSwagger){
            return checkPathsImpl(oldSwagger, newSwagger);
        },
        checkModels: function(oldSwagger, newSwagger){
            return checkModelsImpl(oldSwagger, newSwagger);
        },
        checkOperations: function(oldSwagger, newSwagger){
            return checkOperationsImpl(oldSwagger, newSwagger);
        },
        checkAll: function(oldSwagger, newSwagger){
            function merge(a,b, key){
                if(b[key]){
                    a[key] = _.concat(a[key], b[key]);
                }
            }

            var paths = checkPathsImpl(oldSwagger, newSwagger);
            var models = checkModelsImpl(oldSwagger, newSwagger);
            var operations = checkOperationsImpl(oldSwagger, newSwagger);

            var returnData = {};
            returnData[MAJOR_CHANGE] = [];
            returnData[MINOR_CHANGE] = [];
            returnData[POINT_CHANGE] = [];

            merge(returnData, paths, MAJOR_CHANGE);
            merge(returnData, paths, MINOR_CHANGE);
            merge(returnData, paths, POINT_CHANGE);

            merge(returnData, models, MAJOR_CHANGE);
            merge(returnData, models, MINOR_CHANGE);
            merge(returnData, models, POINT_CHANGE);

            merge(returnData, operations, MAJOR_CHANGE);
            merge(returnData, operations, MINOR_CHANGE);
            merge(returnData, operations, POINT_CHANGE);

            return returnData;
        },
        /*
        @param swaggerDiff Swagger diff object created by one of the check* methods
        @param versionFilePath path to the version file
        @example example version file
        {
            "major" :"0",
            "minor" :"0",
            "point" :"0",
            "changelog":{

            }
        }
        */
        updateVersionFile: function(swaggerDiff, versionFilePath){

            version = JSON.parse(fs.readFileSync(versionFilePath, 'UTF-8'));
            var versionChanged = true;

            if(swaggerDiff[MAJOR_CHANGE] && swaggerDiff[MAJOR_CHANGE].length > 0){
                version.major = version.major + 1;
            } else if(swaggerDiff[MINOR_CHANGE] && swaggerDiff[MINOR_CHANGE].length > 0){
                version.minor = version.minor + 1;
            } else if(swaggerDiff[POINT_CHANGE] && swaggerDiff[POINT_CHANGE].length > 0){
                version.point = version.point + 1;
            } else{
                versionChanged = false;
            }

            if(versionChanged){
                var changes = []
                if(swaggerDiff[MAJOR_CHANGE] && swaggerDiff[MAJOR_CHANGE].length > 0){
                    changes = changes.concat(swaggerDiff[MAJOR_CHANGE]);
                }

                if(swaggerDiff[MINOR_CHANGE] && swaggerDiff[MINOR_CHANGE].length > 0){
                    changes = changes.concat(swaggerDiff[MINOR_CHANGE]);
                }

                if(swaggerDiff[POINT_CHANGE] && swaggerDiff[POINT_CHANGE].length > 0){
                    changes = changes.concat(swaggerDiff[POINT_CHANGE]);
                }

                version.changelog[getVersionString(version)] = changes;

                fs.writeFileSync(versionFilePath, JSON.stringify(version));
            }

            return versionChanged;

        }


    }
};
