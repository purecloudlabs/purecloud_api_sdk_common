//THIS NPM MODULE WILL COMPARE 2 SWAGGER DEFINITION OBJECTS TO SEE IF THERE ARE
//ANY MAJOR OR MINOR POINT CHANGES FOR CLIENT LIBRARIES GENERATED OFF OF THEM

var _ = require('lodash');
var fs = require('fs');
var semver = require('semver');

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
                            addBreakingError(breakingPaths, MAJOR_CHANGE, oldPath + " " + methodKey + " operation ID changed from " + oldOperation.operationId + " to " + newOperation.operationId);
                        }

                        if(oldOperation.description !== newOperation.description){
                            addBreakingError(breakingPaths, POINT_CHANGE, oldPath + " " + methodKey + " operation description changed " + oldOperation.operationId);
                        }

                        if(oldOperation.summary !== newOperation.summary){
                            addBreakingError(breakingPaths, POINT_CHANGE, oldPath + " " + methodKey + " operation summary changed " + oldOperation.operationId);
                        }

                        if(oldOperation.parameters.length !== newOperation.parameters.length){
                            addBreakingError(breakingPaths, MAJOR_CHANGE, "Parameter count for " + pathKey + " Method: " + methodKey + " changed");
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
                                    addBreakingError(breakingPaths, MAJOR_CHANGE, "Response " + responseCode + " was removed for " + responseCode + " " + oldPath);
                                }else{
                                    var newResponse = newOperation.responses[responseCode];
                                    if(newResponse.description !== oldResponse.description){
                                        addBreakingError(breakingPaths, POINT_CHANGE, "Response description for " + pathKey + " changed for " + responseCode + " " + oldPath);
                                    }

                                    if(oldResponse.schema && (!newResponse.schema ||  newResponse.schema["$ref"] !== oldResponse.schema["$ref"])){
                                        addBreakingError(breakingPaths, MAJOR_CHANGE, "Response type for " + pathKey + " changed for " + responseCode + " " + oldPath);
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

                    if(!oldModel.properties || !oldModel.properties[propertyKey]){
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
            addBreakingError(breaking, MAJOR_CHANGE, "Paths removed: " + removedPaths.join(', '));
        }

        if(addedPaths.length > 0){
            addBreakingError(breaking, MINOR_CHANGE, "Paths added " + addedPaths.join(', '));
        }

        return breaking;
    }

    function getVersionStringImpl(versionJson){
        return versionJson.major + "." + versionJson.minor + "." + versionJson.point;
    }

    function getChangeReadmeTextImpl(versionChangelog){
        var readme = "";

        if(versionChangelog[MAJOR_CHANGE] && versionChangelog[MAJOR_CHANGE].length > 0){
            readme = readme + "Breaking Changes\n--------------\n";
            _.each(versionChangelog[MAJOR_CHANGE], function(item) { readme =readme + item + "\n"; });
        }

        if(versionChangelog[MINOR_CHANGE] && versionChangelog[MINOR_CHANGE].length > 0){
            readme = readme + "\nAdditions\n--------------\n";
            _.each(versionChangelog[MINOR_CHANGE], function(item) { readme =readme + item + "\n"; });
        }

        if(versionChangelog[POINT_CHANGE] && versionChangelog[POINT_CHANGE].length > 0){
            readme = readme + "\nOther Changes\n--------------\n";
            _.each(versionChangelog[POINT_CHANGE], function(item) { readme = readme + item + "\n"; });
        }

        return readme;
    }

    return{
        getChangeReadmeText: function(versionChangelog){
            return getChangeReadmeTextImpl(versionChangelog);
        },
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
            "major" :0,
            "minor" :0,
            "point" :0,
            "changelog":{

            }
        }
        */
        updateVersionFile: function(swaggerDiff, versionFilePath){

            version = JSON.parse(fs.readFileSync(versionFilePath, 'UTF-8'));
            //console.log("Current version: " + getVersionStringImpl(version))
            var versionChanged = true;

            if(swaggerDiff[MAJOR_CHANGE] && swaggerDiff[MAJOR_CHANGE].length > 0){
                if(version.major > 0){
                    version.major = version.major + 1;
                }else{
                    //for beta versions, don't rev into the 1.x
                    version.minor = version.minor + 1;
                }

            } else if(swaggerDiff[MINOR_CHANGE] && swaggerDiff[MINOR_CHANGE].length > 0){
                version.minor = version.minor + 1;
            } else if(swaggerDiff[POINT_CHANGE] && swaggerDiff[POINT_CHANGE].length > 0){
                version.point = version.point + 1;
            } else{
                versionChanged = false;
            }

            if(versionChanged){
                var changes = {};
                if(swaggerDiff[MAJOR_CHANGE] && swaggerDiff[MAJOR_CHANGE].length > 0){
                    changes[MAJOR_CHANGE] = swaggerDiff[MAJOR_CHANGE];
                }

                if(swaggerDiff[MINOR_CHANGE] && swaggerDiff[MINOR_CHANGE].length > 0){
                    changes[MINOR_CHANGE] = swaggerDiff[MINOR_CHANGE];
                }

                if(swaggerDiff[POINT_CHANGE] && swaggerDiff[POINT_CHANGE].length > 0){
                    changes[POINT_CHANGE] = swaggerDiff[POINT_CHANGE];
                }

                version.changelog[getVersionStringImpl(version)] = changes;

                fs.writeFileSync(versionFilePath, JSON.stringify(version));

                //console.log("New version: " + getVersionStringImpl(version));
            }else{
                //console.log("Version did not change")
            }

            return versionChanged;

        },

        /**
         * Gets the version from the given file as a string in the form of "major.minor.point"
         * @param  {string} versionFilePath     Path to the version file
         * @return {string}                     The version string
         */
        getVersionString: function(versionFilePath) {
            version = JSON.parse(fs.readFileSync(versionFilePath, 'UTF-8'));
            //console.log(JSON.stringify(version))
            return getVersionStringImpl(version);
        },

        /**
         * Gets the version from the given file as a JSON document
         * @param  {string} versionFilePath     Path to the version file
         * @return {string}                     The version as a JSON object
         */
        getVersion: function(versionFilePath) {
            version = JSON.parse(fs.readFileSync(versionFilePath, 'UTF-8'));
            delete version.changelog;
            return version;
        }
    }
};
