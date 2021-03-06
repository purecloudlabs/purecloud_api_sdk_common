var fs = require('fs');

var swagger = {};
swagger.swaggerGen = require('./swagger_gen.js');
swagger.swaggerVersioning = require('./swagger_versioning.js');
swagger.createRelease = require('./create_release.js');

swagger.updateSwaggerAndVersion = function (swaggerFileName, versionFileName, environment, callback){
    var oldSwagger = JSON.parse(fs.readFileSync(swaggerFileName, 'UTF-8'));

    gen = swagger.swaggerGen();
    versioning = swagger.swaggerVersioning();

    gen.downloadSwaggerFile(environment, function(swagger){

        var swaggerOverridePath = process.env['SWAGGER_OVERRIDE_PATH'];
        var swaggerOverrideStats = null;
        try {
            swaggerOverrideStats = fs.statSync(swaggerOverridePath);
        } catch(e) {}
        if (swaggerOverrideStats) {
            console.log('Using swagger from override path: ' + swaggerOverridePath);
            swagger = JSON.parse(fs.readFileSync(swaggerOverridePath, 'UTF-8'));
        }

        gen.addNotificationsToSwagger(gen.sanitizeSwagger(swagger), environment)
            .then(function(newSwagger) {
                var swaggerDifferences = versioning.checkAll(oldSwagger, newSwagger);

                var hasChanges = versioning.updateVersionFile(swaggerDifferences, versionFileName);

                if(hasChanges){
                    fs.writeFileSync(swaggerFileName, JSON.stringify(newSwagger));
                    console.log(versioning.getVersionString(versionFileName))
                }

                callback(hasChanges);
            })
            .fail(function(e){ console.log(e); });
    });
}
module.exports = swagger;
