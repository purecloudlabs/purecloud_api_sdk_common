const fs = require('fs');
const _ = require('lodash');
const childProcess = require('child_process');



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



String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};



SwaggerDiff.prototype.changes = {};
SwaggerDiff.prototype.changeCount = 0;



SwaggerDiff.prototype.getAndDiff = function(oldSwaggerPath, newSwaggerPath) {
    // download or read files, call diffSwagger
    var oldSwagger, newSwagger;

    // Retrieve old swagger
    if (fs.existsSync(oldSwaggerPath)) {
        console.log(`Loading old swagger from disk: ${oldSwaggerPath}`);
        oldSwagger = JSON.parse(fs.readFileSync(oldSwaggerPath, 'utf8'));
    } else if (oldSwaggerPath.toLowerCase().startsWith('http')) {
        console.log(`Downloading old swagger from: ${oldSwaggerPath}`);
        oldSwagger = JSON.parse(downloadFile(oldSwaggerPath));
    } else {
        console.log(`WARNING: Invalid oldSwaggerPath: ${oldSwaggerPath}`);
    }

    console.log(`Old swagger length: ${JSON.stringify(oldSwagger).length}`);

    // Retrieve new swagger
    if (fs.existsSync(newSwaggerPath)) {
        console.log(`Loading new swagger from disk: ${newSwaggerPath}`);
        newSwagger = JSON.parse(fs.readFileSync(newSwaggerPath, 'utf8'));
    } else if (newSwaggerPath.toLowerCase().startsWith('http')) {
        console.log(`Downloading old swagger from: ${newSwaggerPath}`);
        newSwagger = JSON.parse(downloadFile(newSwaggerPath));
    } else {
        console.log(`WARNING: Invalid newSwaggerPath: ${newSwaggerPath}`);
    }

    console.log(`New swagger length: ${JSON.stringify(newSwagger).length}`);


    //fs.writeFileSync('oldSwagger.json', JSON.stringify(oldSwagger, null, 2));
    //fs.writeFileSync('newSwagger.json', JSON.stringify(newSwagger, null, 2));
    
    this.diff(oldSwagger, newSwagger);
};

SwaggerDiff.prototype.diff = function(oldSwagger, newSwagger) {
    console.log('Diffing swagger files...');
    checkOperationsImpl(oldSwagger, newSwagger);

    console.log(JSON.stringify(this.changes, null, 2));
};

SwaggerDiff.prototype.getMarkdownReleaseNotes = function() {
    //TODO: use doT for templating?
    var major = {};
    var minor = {};
    var point = {};

    console.log(`Generating notes for ${this.changeCount} changes...`);

    _.forEach(this.changes, function (changeItem, entity) {
        if (changeItem.major) {
            if (!major[entity]) 
                major[entity] = [];

            _.forEach(changeItem.major, function(changeDetail) {
                major[entity].push(changeDetail.description);
            });
        }

        if (changeItem.minor) {
            if (!minor[entity]) 
                minor[entity] = [];

            _.forEach(changeItem.minor, function(changeDetail) {
                minor[entity].push(changeDetail.description);
            });
        }

        if (changeItem.point) {
            if (!point[entity]) 
                point[entity] = [];

            _.forEach(changeItem.point, function(changeDetail) {
                point[entity].push(changeDetail.description);
            });
        }
    });

    var output = '';
    var lastKey = '';

    if (_.keys(major).length > 0) {
        output += '# Major Changes\n';
        lastKey = '';
        _.forEach(major, function(changes, key) {
            if (lastKey != key) {
                lastKey = key;
                output += `\n**${key}**\n\n`;
            }
            _.forEach(changes, function(changeString) {
                output += `* ${changeString}\n`;
            });
        });
        output += '\n';
    }

    if (_.keys(minor).length > 0) {
        output += '# Minor Changes\n';
        lastKey = '';
        _.forEach(minor, function(changes, key) {
            if (lastKey != key) {
                lastKey = key;
                output += `\n**${key}**\n\n`;
            }
            _.forEach(changes, function(changeString) {
                output += `* ${changeString}\n`;
            });
        });
        output += '\n';
    }

    if (_.keys(point).length > 0) {
        output += '# Point Changes\n';
        lastKey = '';
        _.forEach(point, function(changes, key) {
            if (lastKey != key) {
                lastKey = key;
                output += `\n**${key}**\n\n`;
            }
            _.forEach(changes, function(changeString) {
                output += `* ${changeString}\n`;
            });
        });
        output += '\n';
    }

    return output;
};



function downloadFile(url) {
    // Source: https://www.npmjs.com/package/download-file-sync
    return childProcess.execFileSync('curl', ['--silent', '-L', url], {encoding: 'utf8'});
}

function addChange(id, key, location, impact, oldValue, newValue, description) {
    // Generate default description
    if (!description) {
        if (!oldValue && newValue)
            description = `${location.capitalizeFirstLetter()} ${key} was added`;
        else if (oldValue && !newValue)
            description = `${location.capitalizeFirstLetter()} ${key} was removed`;
        else
            description = `${location.capitalizeFirstLetter()} ${key} was changed from ${oldValue} to ${newValue}`;
    }

    // Initialize
    if (!self.changes[id])
        self.changes[id] = {};
    if (!self.changes[id][impact])
        self.changes[id][impact] = [];

    // Add
    self.changes[id][impact].push({
        "key": key,
        "location": location,
        "oldValue": oldValue,
        "newValue": newValue,
        "description": description
    });

    self.changeCount++;
}

function checkForChange(id, key, location, impact, property, oldObject, newObject, description) {
    var oldProperty = oldObject ? oldObject[property] : undefined;
    var newProperty = newObject ? newObject[property] : undefined;

    //console.log(`Compare [${id}][${key}][${property}] -> ${oldProperty}, ${newProperty}`);

    // Have one but not the other, or properties aren't equal
    if ((!oldObject && newObject) || (oldObject && !newObject) || (oldProperty !== newProperty))
        addChange(id, key ? key : property, location, impact, oldProperty, newProperty, description);
}

function checkOperationsImpl(oldSwagger, newSwagger) {
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
            // Add note about the new path itself
            addChange(pathKey, pathKey, LOCATION_PATH, IMPACT_MINOR, undefined, pathKey, `Path was added`);

            // Add each operation
            _.forEach(newPath, function(newOperation, methodKey) {
                addChange(pathKey, methodKey.toUpperCase(), LOCATION_OPERATION, IMPACT_MINOR, undefined, pathKey);
            });
        } else {
            // Check for removed operations
            _.forEach(oldPath, function(oldOperation, methodKey) {
                var newOperation = newPath[methodKey];
                if (!newOperation) {
                    addChange(pathKey, methodKey.toUpperCase(), LOCATION_OPERATION, IMPACT_MAJOR, undefined, undefined);
                }
            });

            // Check for changed and added operations
            _.forEach(newPath, function(newOperation, methodKey) {
                var oldOperation = oldPath[methodKey];
                if (!oldOperation) {
                    // Operation was added
                    addChange(pathKey, methodKey.toUpperCase(), LOCATION_OPERATION, IMPACT_MINOR, undefined, undefined);
                } else {
                    var operationMethodAndPath = `${methodKey.toUpperCase()} ${pathKey}`;



                    // Check operation properties
                    checkForChange(operationMethodAndPath, undefined, LOCATION_OPERATION, IMPACT_MAJOR, 'operationId', oldOperation, newOperation);
                    checkForChange(operationMethodAndPath, undefined, LOCATION_OPERATION, IMPACT_POINT, 'description', oldOperation, newOperation, 'Description was changed');
                    checkForChange(operationMethodAndPath, undefined, LOCATION_OPERATION, IMPACT_POINT, 'summary', oldOperation, newOperation, 'Summary was changed');
                    checkForChange(operationMethodAndPath, undefined, LOCATION_OPERATION, IMPACT_MAJOR, 'x-inin-method-name', oldOperation, newOperation);

                    // Check for deprecated
                    if (newOperation.deprecated === true && oldOperation.deprecated !== true) {
                        addChange(operationMethodAndPath, 'deprecated', LOCATION_OPERATION, IMPACT_MAJOR, oldOperation.deprecated, newOperation.deprecated, `Has been deprecated`);
                    } else if (newOperation.deprecated !== true && oldOperation.deprecated === true) {
                        // This condition should never happen, but let's be thorough
                        addChange(operationMethodAndPath, 'deprecated', LOCATION_OPERATION, IMPACT_MAJOR, oldOperation.deprecated, newOperation.deprecated, `Has been undeprecated`);
                    }



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
                        var oldParam = oldParams[newParam.name];
                        if (!oldParam) {
                            // Parameter was added, major change if in path or required
                            var i = useSdkVersioning || newParam.in.toLowerCase() === 'path' || newParam.required === true;
                            addChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, i ? IMPACT_MAJOR : IMPACT_MINOR, undefined, newParam.name);
                        } else {
                            checkForChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_MAJOR, 'in', oldParam, newParam);
                            checkForChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_MAJOR, 'type', oldParam, newParam);
                            checkForChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_POINT, 'description', oldParam, newParam, `Description was changed for parameter ${newParam.name}`);

                            // Major if made required
                            if (oldParam.required !== newParam.required) {
                                if (newParam.required === true) {
                                    addChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_MAJOR, oldParam.required, newParam.required, `Parameter ${newParam.name} was made required`);
                                } else {
                                    addChange(operationMethodAndPath, newParam.name, LOCATION_PARAMETER, IMPACT_MINOR, oldParam.required, newParam.required, `Parameter ${newParam.name} was made optional`);
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
                            // Response was added
                            addChange(operationMethodAndPath, newResponseCode, LOCATION_RESPONSE, IMPACT_MINOR, undefined, newResponseCode);
                        } else {
                            checkForChange(operationMethodAndPath, newResponseCode, LOCATION_RESPONSE, IMPACT_POINT, 'description', oldResponse, newResponse);
                            checkForChange(operationMethodAndPath, newResponseCode, LOCATION_RESPONSE, IMPACT_MAJOR, '$ref', oldResponse.schema, newResponse.schema);
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



var self = module.exports = new SwaggerDiff();