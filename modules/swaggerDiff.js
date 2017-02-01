



const IMPACT_MAJOR = 'major';
const IMPACT_MINOR = 'minor';
const IMPACT_POINT = 'point';
const LOCATION_OPERATION = 'operation';
const LOCATION_PARAMETER = 'parameter';
const LOCATION_RESPONSE = 'response';
const LOCATION_TAG = 'tag';
const LOCATION_MODEL = 'model';
const LOCATION_PATH = 'path';

var useSdkVersioning = false;



function SwaggerDiff() {

}



SwaggerDiff.prototype.changes = {
    "id": { // operation/model/path string
        "impact": [ // [major|minor|point]
            {
                "name": "", // something identifying
                "oldValue": "",
                "newValue": "",
                "description": "" // leave blank to follow auto-gen rules
            }
        ]
    }
      
};



SwaggerDiff.prototype.getAndDiff = function(oldSwaggerPath, newSwaggerPath) {
    // download or read files, call diffSwagger
};

SwaggerDiff.prototype.diff = function(oldSwagger, newSwagger) {

};



function addChange(id, key, location, impact, oldValue, newValue, description) {
    // Generate default description
    if (!description) {
        if (!oldValue && newValue)
            description = `${location} ${key} was added`;
        else if (oldValue && !newValue)
            description = `${location} ${key} was removed`;
        else
            description = `${location} ${key} was changed from ${oldValue} to ${newValue}`;
    }

    // Initialize
    if (!changes[id])
        changes[id] = {};
    if (!changes[id][impact])
        changes[id][impact] = [];

    // Add
    changes[id][impact].push({
        "key": key,
        "location": location,
        "oldValue": oldValue,
        "newValue": newValue,
        "description": description
    });
}

function checkForChange(id, key, location, impact, property, oldObject, newObject, description) {
    var oldProperty = oldObject ? oldObject[property] : undefined;
    var newProperty = newObject ? newObject[property] : undefined;

    // Have one but not the other, or properties aren't equal
    if ((!oldObject && newObject) || (oldObject && !newObject) || (oldProperty !== newProperty))
        addChange(id, key ? key : property, location, impact, oldProperty, newProperty, description);
}

function checkOperationsImplV2(oldSwagger, newSwagger) {
    // Check for removed paths
    _.forEach(oldSwagger.paths, function(oldPath, pathKey) {
        var newPath = newSwagger.paths[pathKey];
        if (!newPath) {
            addChange(pathKey, pathKey, LOCATION_PATH, IMPACT_MAJOR, pathKey, undefined);
        }
    });

    // Check for changed and added paths
    _.forEach(newSwagger.paths, function(newPath, pathKey) {
        var oldPath = oldSwagger.paths[pathKey];
        if (!oldPath) {
            // path was added
            addChange(pathKey, pathKey, LOCATION_PATH, IMPACT_MINOR, undefined, pathKey);
        } else {
            // Check for removed operations
            _.forEach(oldPath, function(oldOperation, methodKey) {
                var newOperation = newPath[methodKey];
                if (!newOperation) {
                    addChange(`${methodKey.toUpperCase()} pathKey`, methodKey.toUpperCase(), LOCATION_OPERATION, IMPACT_MAJOR, undefined, undefined, `Method  ${methodKey.toUpperCase()} for ${pathKey} was removed`);
                }
            });

            // Check for changed and added operations
            _.forEach(oldPath, function(newOperation, methodKey) {
                var oldOperation = oldPath[methodKey];
                if (!oldOperation) {
                    // Operation was added
                    addChange(`${methodKey.toUpperCase()} pathKey`, methodKey.toUpperCase(), LOCATION_OPERATION, IMPACT_MINOR, undefined, undefined, `Method  ${methodKey.toUpperCase()} for ${pathKey} was added`);
                } else {
                    var operationMethodAndPath = `${methodKey.toUpperCase()} ${pathKey}`;



                    // Check operation properties
                    checkForChange(operationMethodAndPath, undefined, LOCATION_OPERATION, IMPACT_MAJOR, 'operationId', oldOperation, newOperation);
                    checkForChange(operationMethodAndPath, undefined, LOCATION_OPERATION, IMPACT_POINT, 'description', oldOperation, newOperation, 'description was changed');
                    checkForChange(operationMethodAndPath, undefined, LOCATION_OPERATION, IMPACT_POINT, 'summary', oldOperation, newOperation, 'summary was changed');
                    checkForChange(operationMethodAndPath, undefined, LOCATION_OPERATION, IMPACT_POINT, 'x-inin-method-name', oldOperation, newOperation);



                    // Make parameters KVPs
                    var oldParams = {};
                    var newParams = {};
                    _.forEach(oldOperation.parameters, function(p) { oldParams[p.name] = p; });
                    _.forEach(newOperation.parameters, function(p) { newParams[p.name] = p; }); 

                    // Check for removed parameters
                    _.forEach(oldParams, function(oldParam) {
                        if (!newParams[oldParam.name]) {
                            addChange(operationMethodAndPath, oldParam.name, LOCATION_PARAMETER, IMPACT_MAJOR, oldParam.name, undefined);
                        }
                    });

                    // Check for changed and added parameters
                    _.forEach(newParams, function(newParam) {
                        var oldParam = oldParams[oldParam.name];
                        if (!oldParam) {
                            // Parameter was added, major change if in path or required
                            var i = useSdkVersioning || newParam.in.toLowerCase() === 'path' || newParam.required === true;
                            addChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, i, undefined, newParam.name);
                        } else {
                            checkForChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_MAJOR, 'in', oldParam, newParam);
                            checkForChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_MAJOR, 'type', oldParam, newParam);
                            checkForChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_POINT, 'description', oldParam, newParam);

                            // Major if made required
                            if (oldParam.required !== newParam.required) {
                                if (newParam.required === true) {
                                    addChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_MAJOR, oldParam.required, newParam.required, `parameter ${newParam.name} was made required`);
                                } else {
                                    addChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_MINOR, oldParam.required, newParam.required, `parameter ${newParam.name} was made optional`)
                                }
                            }
                        }
                    });



                    // Check for removed responses
                    _.forEach(oldOperation.responses, function(oldResponse, oldResponseCode) {
                        if (!newOperation.responses[oldResponseCode]) {
                            addChange(operationMethodAndPath, oldResponseCode, LOCATION_RESPONSE, IMPACT_MAJOR, oldResponseCode, undefined);
                        }
                    });

                    // Check for changed and added responses
                    _.forEach(newOperation.responses, function(newResponse, newResponseCode) {
                        var oldResponse = oldOperation.responses[newResponseCode];
                        if (!oldResponse) {
                            addChange(operationMethodAndPath, newResponseCode, LOCATION_RESPONSE, IMPACT_MINOR, undefined, newResponseCode);
                        } else {
                            checkForChange(operationMethodAndPath, newResponseCode, LOCATION_RESPONSE, IMPACT_POINT, 'description', oldResponse, newResponse);
                            checkForChange(operationMethodAndPath, newResponseCode, LOCATION_RESPONSE, IMPACT_POINT, '$ref', oldResponse.schema, newResponse.schema);
                        }
                    });



                    // Check for removed tags
                    _.forEach(_.difference(oldOperation.tags, newOperation.tags), function(tag) {
                        addChange(operationMethodAndPath, tag, LOCATION_TAG, IMPACT_MAJOR, tag, undefined);
                    });

                    // Check for added tags
                    _.forEach(_.difference(newOperation.tags, oldOperation.tags), function(tag) {
                        addChange(operationMethodAndPath, tag, LOCATION_TAG, IMPACT_MAJOR, undefined, tag);
                    });
                }
            }); // end operation iteration
        }
    }); // end path iteration
}

function checkModelsImplV2(oldSwagger, newSwagger) {

    var breakingModels = {};

    _.forEach(oldSwagger.definitions, function(oldModel, key) {

        if (newSwagger.definitions[key]) {
            var newModel = newSwagger.definitions[key];

            _.forEach(oldModel.properties, function(oldProperty, propertyKey) {
                if (newModel.properties[propertyKey]) {
                    var newProperty = newModel.properties[propertyKey];

                    if (newProperty.type != oldProperty.type) {
                        addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, "Type " + propertyKey + " of model " + key + " was changed from " + oldProperty.type + " to " + newProperty.type);
                    }

                    if (oldProperty.format && newProperty.format != oldProperty.format) {
                        addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, "Format " + propertyKey + " of model " + key + " was changed from " + oldProperty.format + " to " + newProperty.format);
                    }

                } else {
                    addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, "Property " + propertyKey + " of model " + key + " was removed");
                }
            });

            _.forEach(newModel.properties, function(newProperty, propertyKey) {

                if (!oldModel.properties || !oldModel.properties[propertyKey]) {
                    addChange(breakingModels, MINOR_CHANGE, MODEL_CHANGE, "Property " + propertyKey + " of model " + key + " was added");
                }

            });

        } else  {
            addChange(breakingModels, MAJOR_CHANGE, MODEL_CHANGE, key + " was removed");
        }
    });

    _.forEach(newSwagger.definitions, function(newmodel, key) {

        if (!oldSwagger.definitions[key]) {
            addChange(breakingModels, MINOR_CHANGE, MODEL_CHANGE, key + " was added");
        }
    });

    //console.log(breakingModels);
    return breakingModels;
}



module.exports = new SwaggerDiff();