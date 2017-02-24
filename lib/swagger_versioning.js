//THIS NPM MODULE WILL COMPARE 2 SWAGGER DEFINITION OBJECTS TO SEE IF THERE ARE
//ANY MAJOR OR MINOR POINT CHANGES FOR CLIENT LIBRARIES GENERATED OFF OF THEM

var _ = require('lodash');
var fs = require('fs');
var semver = require('semver');

module.exports = function(){
    const MAJOR_CHANGE = "Major";
    const MINOR_CHANGE = "Minor";
    const POINT_CHANGE = "Point";

    const OPERATION_CHANGE = 'Operation';
    const PARAM_CHANGE = 'Parameter';
    const RESPONSE_CHANGE = 'Response';
    const TAG_CHANGE = 'Tag';
    const MODEL_CHANGE = 'Model';
    const PATH_CHANGE = 'Path';

    function addBreakingError(breakingModels, key, text){
        if(!breakingModels[key]){
            breakingModels[key] = [];
        }

        breakingModels[key].push(text);
    }

    function addChange(changeMap, key, type, text){
        if(!changeMap[key]){
            changeMap[key] = {};
        }

        if(!changeMap[key][type]){
            changeMap[key][type] = [];
        }

        changeMap[key][type].push(text);
    }

    function getPathList(swagger){
        var pathList = [];
        _.forEach(swagger.paths, function(api, path){
            pathList.push(path.replace(/\/api\/v\d/, ''));
        });

        return pathList;
    }

    function checkOperationsImpl(oldSwagger, newSwagger){

        var breakingPaths = {};

        _.forEach(oldSwagger.paths, function(oldPath, pathKey){
            if(newSwagger.paths[pathKey]){
                var newPath = newSwagger.paths[pathKey];
                var pathOperationDifferences = _.difference(Object.keys(newPath), Object.keys(oldPath))
                if(pathOperationDifferences.length > 0){
                    //console.log(oldPath);
                    addBreakingError(breakingPaths, MINOR_CHANGE, "Operation "+ pathOperationDifferences +" added to " + pathKey);
                }

                _.forEach(oldPath, function(oldOperation, methodKey){
                    if(newPath[methodKey]){
                        var newOperation = newPath[methodKey];

                        if(oldOperation.operationId !== newOperation.operationId){
                            addBreakingError(breakingPaths, MAJOR_CHANGE, pathKey + " " + methodKey.toUpperCase() + " operation ID changed from " + oldOperation.operationId + " to " + newOperation.operationId);
                        }

                        if(oldOperation.description !== newOperation.description){
                            addBreakingError(breakingPaths, POINT_CHANGE, pathKey + " " + methodKey.toUpperCase() + " operation description changed " );
                        }

                        if(oldOperation.summary !== newOperation.summary){
                            addBreakingError(breakingPaths, POINT_CHANGE, pathKey + " " + methodKey.toUpperCase() + " operation summary changed " );
                        }

                        if(oldOperation.parameters.length !== newOperation.parameters.length){
                            oldParams = [];//["pageNumber","pageSize","sortBy","sortOrder"]
                            oldOperation.parameters.forEach(function(value){oldParams.push(value.name)})

                            newParams = [];// ["pageNumber","pageSize","sortBy","sortOrder","recordingEnabled"]
                            newOperation.parameters.forEach(function(value){newParams.push(value.name)})

                            var paramChanges = _.difference(newParams, oldParams);

                            if(oldOperation.parameters.length > newOperation.parameters.length){
                                addBreakingError(breakingPaths, MAJOR_CHANGE, "Parameters "+ paramChanges +" removed from " + pathKey + " Method: " + methodKey );
                            }

                            if(oldOperation.parameters.length < newOperation.parameters.length){
                                paramChanges.forEach(function(param){
                                    newOperation.parameters.forEach(function(value){
                                        if(value.name == param){
                                            if(value.required){
                                                addBreakingError(breakingPaths, MAJOR_CHANGE, "Required parameter "+ param +" added to " + pathKey + " Method: " + methodKey );
                                            }else{
                                                addBreakingError(breakingPaths, MINOR_CHANGE, "Optional parameter "+ param +" added to " + pathKey + " Method: " + methodKey );
                                            }
                                        }
                                    });
                                });

                            }

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
                                    addBreakingError(breakingPaths, MAJOR_CHANGE, "Response " + responseCode + " was removed for " + pathKey);
                                }else{
                                    var newResponse = newOperation.responses[responseCode];
                                    if(newResponse.description !== oldResponse.description){
                                        addBreakingError(breakingPaths, POINT_CHANGE, "Response description for " + pathKey + " changed for " + responseCode + " " + pathKey);
                                    }

                                    function getModelType(response){
                                        var type = null;
                                        if(response.schema && response.schema["$ref"]){
                                            type = response.schema["$ref"].replace("#/definitions/", "");
                                        }else if(response.schema && response.schema["items"] && response.schema["items"]["$ref"]){
                                            type = "List of " + response.schema["items"]["$ref"].replace("#/definitions/", "");
                                        }

                                        return type;
                                    }

                                    var oldResponseModel= getModelType(oldResponse);
                                    var newResponseModel= getModelType(newResponse);

                                    if(oldResponseModel !== newResponseModel){
                                        addBreakingError(breakingPaths, MAJOR_CHANGE, "Response type for " + methodKey.toUpperCase() + " " + pathKey + " changed for " + responseCode  + " from " + oldResponseModel + " to " + newResponseModel);
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
                        addBreakingError(breakingPaths, MAJOR_CHANGE, "Method  " + methodKey.toUpperCase() + " for " + pathKey + " was removed");
                    }
                });
            }
        });

        return breakingPaths;
    }

    function checkOperationsImplV2(oldSwagger, newSwagger){

        var breakingPaths = {};

        _.forEach(oldSwagger.paths, function(oldPath, pathKey){
            if(newSwagger.paths[pathKey]){
                var newPath = newSwagger.paths[pathKey];
                var pathOperationDifferences = _.difference(Object.keys(newPath), Object.keys(oldPath))
                if(pathOperationDifferences.length > 0){
                    //console.log(oldPath);
                    addChange(breakingPaths, MINOR_CHANGE, OPERATION_CHANGE, "Operation "+ pathOperationDifferences +" added to " + pathKey);
                }

                _.forEach(oldPath, function(oldOperation, methodKey){
                    if(newPath[methodKey]){
                        var newOperation = newPath[methodKey];

                        if(oldOperation.operationId !== newOperation.operationId){
                            addChange(breakingPaths, MAJOR_CHANGE, OPERATION_CHANGE, pathKey + " " + methodKey.toUpperCase() + " operation ID changed from " + oldOperation.operationId + " to " + newOperation.operationId);
                        }

                        if(oldOperation.description !== newOperation.description){
                            addChange(breakingPaths, POINT_CHANGE, OPERATION_CHANGE, pathKey + " " + methodKey.toUpperCase() + " operation description changed " );
                        }

                        if(oldOperation.summary !== newOperation.summary){
                            addChange(breakingPaths, POINT_CHANGE, OPERATION_CHANGE, pathKey + " " + methodKey.toUpperCase() + " operation summary changed " );
                        }

                        if(oldOperation['x-inin-method-name'] !== newOperation['x-inin-method-name']){
                            addChange(breakingPaths, POINT_CHANGE, OPERATION_CHANGE, methodKey.toUpperCase() + " x-inin-method-name changed from " + oldOperation['x-inin-method-name'] + " to " + newOperation['x-inin-method-name']);
                        }

                        if(oldOperation.parameters.length !== newOperation.parameters.length){
                            oldParams = [];//["pageNumber","pageSize","sortBy","sortOrder"]
                            oldOperation.parameters.forEach(function(value){oldParams.push(value.name)})

                            newParams = [];// ["pageNumber","pageSize","sortBy","sortOrder","recordingEnabled"]
                            newOperation.parameters.forEach(function(value){newParams.push(value.name)})

                            var paramChanges = _.difference(newParams, oldParams);

                            if(oldOperation.parameters.length > newOperation.parameters.length){
                                addChange(breakingPaths, MAJOR_CHANGE, PARAM_CHANGE, "Parameters "+ paramChanges +" removed from " + pathKey + " Method: " + methodKey );
                            }

                            if(oldOperation.parameters.length < newOperation.parameters.length){
                                paramChanges.forEach(function(param){
                                    newOperation.parameters.forEach(function(value){
                                        if(value.name == param){
                                            if(value.required){
                                                addChange(breakingPaths, MAJOR_CHANGE, PARAM_CHANGE, "Required parameter "+ param +" added to " + pathKey + " Method: " + methodKey );
                                            }else{
                                                addChange(breakingPaths, MINOR_CHANGE, PARAM_CHANGE, "Optional parameter "+ param +" added to " + pathKey + " Method: " + methodKey );
                                            }
                                        }
                                    });
                                });

                            }

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
                                        addChange(breakingPaths, MAJOR_CHANGE, PARAM_CHANGE, paramName + " of parameter " + oldParam.name + " was changed from " + oldParam[paramName] + " to " + newParam[paramName]);
                                    }
                                }

                                if(oldParam.format && newParam.format != oldParam.format){
                                    addChange(breakingPaths, MAJOR_CHANGE, PARAM_CHANGE, "Format of parameter " + oldParam.name + " was changed from " + oldParam.format + " to " + newParam.format);
                                }

                            }
                        }

                        if(oldOperation.responses.length !== newOperation.responses.length){
                            addChange(breakingPaths, MAJOR_CHANGE, RESPONSE_CHANGE, "Response count for " + oldPath + " changed");
                        }else{
                            _.forEach(oldOperation.responses, function(oldResponse, responseCode){
                                if(!newOperation.responses[responseCode]){
                                    addChange(breakingPaths, MAJOR_CHANGE,RESPONSE_CHANGE,   responseCode + " was removed for " + pathKey);
                                }else{
                                    var newResponse = newOperation.responses[responseCode];
                                    if(newResponse.description !== oldResponse.description){
                                        addChange(breakingPaths, POINT_CHANGE, RESPONSE_CHANGE, "Description for " + pathKey + " changed for " + responseCode + " " + pathKey);
                                    }

                                    if(oldResponse.schema && (!newResponse.schema ||  newResponse.schema["$ref"] !== oldResponse.schema["$ref"])){
                                        addChange(breakingPaths, MAJOR_CHANGE, RESPONSE_CHANGE, "Type for " + pathKey + " changed for " + responseCode + " " + pathKey);
                                    }
                                }
                            });
                        }

                        //checkTags
                        var oldOperationTags = oldOperation.tags;
                        var newOperationTags = newOperation.tags;

                        if(_.difference(oldOperationTags, newOperationTags).length !== 0){
                            //has removed paths
                            addChange(breakingPaths, MAJOR_CHANGE, TAG_CHANGE, "Tag removed from " + pathKey);
                        }

                        if(_.difference(newOperationTags, oldOperationTags).length !== 0){
                            //has new paths
                            addChange(breakingPaths, MINOR_CHANGE, TAG_CHANGE, "Tag added to " + pathKey);
                        }
                    }
                    else{
                        addChange(breakingPaths, MAJOR_CHANGE, OPERATION_CHANGE, "Method  " + methodKey.toUpperCase() + " for " + pathKey + " was removed");
                    }
                });


            }
        });

        return breakingPaths;
    }

    function checkModelsImpl(oldSwagger, newSwagger){

        var breakingModels = {};

        _.forEach(oldSwagger.definitions, function(oldModel, key){

            if(newSwagger.definitions[key]){
                var newModel = newSwagger.definitions[key];

                //Compare the properties on a model
                var breakingRemovedChanges = [];

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
                        //addBreakingError(breakingModels, MAJOR_CHANGE, "Property " + propertyKey + " of model " + key + " was removed");
                        breakingRemovedChanges.push(propertyKey);
                    }
                });


                if(breakingRemovedChanges.length > 0){
                    var property = breakingRemovedChanges.length == 1 ? "property" : "properties";

                    addBreakingError(breakingModels, MAJOR_CHANGE, "Model " + key + " had " + property + " " + breakingRemovedChanges.join(", ") + " removed");
                }

                var addedProperties = [];
                _.forEach(newModel.properties, function(newProperty, propertyKey){

                    if(!oldModel.properties || !oldModel.properties[propertyKey]){
                        //addBreakingError(breakingModels, MINOR_CHANGE, "Property " + propertyKey + " of model " + key + " was added");
                        addedProperties.push(propertyKey);
                    }

                });

                if(addedProperties.length > 0){
                    var property = addedProperties.length == 1 ? "property" : "properties";
                    addBreakingError(breakingModels, MINOR_CHANGE, "Model " + key + " had " + property + " " + breakingRemovedChanges.join(", ") + " added");
                }



            }else{
                addBreakingError(breakingModels, MAJOR_CHANGE, "Model " + key + " was removed");
            }
        });

        _.forEach(newSwagger.definitions, function(newmodel, key){

            if(!oldSwagger.definitions[key]){
                addBreakingError(breakingModels, MINOR_CHANGE, "Model " + key + " was added");
            }
        });

        //console.log(breakingModels);
        return breakingModels;
    }

    function checkModelsImplV2(oldSwagger, newSwagger){

        var breakingModels = {};

        _.forEach(oldSwagger.definitions, function(oldModel, key){

            if(newSwagger.definitions[key]){
                var newModel = newSwagger.definitions[key];

                _.forEach(oldModel.properties, function(oldProperty, propertyKey){
                    if(newModel.properties[propertyKey]){
                        var newProperty = newModel.properties[propertyKey];

                        if(newProperty.type != oldProperty.type){
                            addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, "Type " + propertyKey + " of model " + key + " was changed from " + oldProperty.type + " to " + newProperty.type);
                        }

                        if(oldProperty.format && newProperty.format != oldProperty.format){
                            addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, "Format " + propertyKey + " of model " + key + " was changed from " + oldProperty.format + " to " + newProperty.format);
                        }


                        if(oldProperty.type === "array"){

                            if(newProperty.items.$ref != oldProperty.items.$ref){
                                addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, "Item Type " + propertyKey + " of model " + key + " was changed from " + oldProperty.items.$ref + " to " + newProperty.items.$ref);
                            }
                        }

                        if(newProperty.$ref != oldProperty.$ref){
                            addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, "Item Type " + propertyKey + " of model " + key + " was changed from " + oldProperty.$ref + " to " + newProperty.$ref);
                        }


                    }
                    else{
                        addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, "Property " + propertyKey + " of model " + key + " was removed");
                    }
                });

                _.forEach(newModel.properties, function(newProperty, propertyKey){

                    if(!oldModel.properties || !oldModel.properties[propertyKey]){
                        addChange(breakingModels, MINOR_CHANGE, MODEL_CHANGE, "Property " + propertyKey + " of model " + key + " was added");
                    }

                });

            }else{
                addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, key + " was removed");
            }
        });

        _.forEach(newSwagger.definitions, function(newmodel, key){

            if(!oldSwagger.definitions[key]){
                addChange(breakingModels, MINOR_CHANGE, MODEL_CHANGE, key + " was added");
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
            for(var x=0; x<removedPaths.length; x++){
                addBreakingError(breaking, MAJOR_CHANGE, "Path removed: " + removedPaths[x]);
            }
        }

        if(addedPaths.length > 0){
            for(var x=0; x<addedPaths.length; x++){
                addBreakingError(breaking, MINOR_CHANGE, "Path added: " + addedPaths[x]);
            }
        }

        return breaking;
    }

    function checkPathsImplV2(oldSwagger, newSwagger){
        var breaking = {};

        var removedPaths = _.difference(getPathList(oldSwagger), getPathList(newSwagger));
        var addedPaths =  _.difference(getPathList(newSwagger), getPathList(oldSwagger));

        if(removedPaths.length > 0){
            for(var x=0; x<removedPaths.length; x++){
                addChange(breaking, MAJOR_CHANGE, PATH_CHANGE, "Removed: " + removedPaths[x]);
            }
        }

        if(addedPaths.length > 0){
            for(var x=0; x<addedPaths.length; x++){
                addChange(breaking, MINOR_CHANGE, PATH_CHANGE, "Added: " + addedPaths[x]);
            }
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
        checkAllV2: function(oldSwagger, newSwagger){
            function merge(src,obj){
                /*if(b[key]){
                    a[key] = _.concat(a[key], b[key]);
                }*/

                 Object.keys(src).forEach(function(key) {

                     if(obj[key]){
                         Object.keys(obj[key]).forEach(function(typeKey) {
                             if(typeof src[key][typeKey] === 'undefined' || src[key][typeKey] === null){
                                 src[key][typeKey]= []
                             }
                             //debugger;
                             src[key][typeKey] = _.concat(src[key][typeKey], obj[key][typeKey]);
                         });
                     }


                 });
            }

            var paths = checkPathsImplV2(oldSwagger, newSwagger);
            var models = checkModelsImplV2(oldSwagger, newSwagger);
            var operations = checkOperationsImplV2(oldSwagger, newSwagger);

            var returnData = {};
            returnData[MAJOR_CHANGE] = {};
            returnData[MINOR_CHANGE] = {};
            returnData[POINT_CHANGE] = {};

            merge(returnData, paths);
            merge(returnData, models);
            merge(returnData, operations);

            return returnData;
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
            var file = '';
            try {
                file = fs.readFileSync(versionFilePath, 'UTF-8');
            } catch(e) {
                file = '{"major":0,"minor":0,"point":0,"changelog":{}}';
            }
            version = JSON.parse(file);
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
            var changes = {};

            if(versionChanged == false){
                if(process.env.INCREMENT_MINOR == 'true'){
                    version.minor = version.minor + 1;
                    changes[MINOR_CHANGE] = [process.env.RELEASE_NOTES];
                    versionChanged = true;
                }

                if(process.env.INCREMENT_POINT == 'true'){
                    version.point = version.point + 1;
                    changes[POINT_CHANGE] = [process.env.RELEASE_NOTES];
                    versionChanged = true;
                }
            }

            if(versionChanged){
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
