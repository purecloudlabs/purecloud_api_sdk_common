var swagger = {};
swagger.swaggerGen = require('./swagger_gen.js');
swagger.swaggerVersioning = require('./swagger_versioning.js');

swagger.updateSwaggerAndVersion = function (swaggerFileName, versionFileName, environment, callback){
    var oldSwagger = JSON.parse(fs.readFileSync(swaggerFileName, 'UTF-8'));

    swagger.swaggerGen().downloadSwaggerFile(environment, function(swagger){

        var newSwagger = swagger.swaggerGen().sanitizeSwagger(swagger);

        var swaggerDifferences = swagger.swaggerVersioning().checkAll(oldSwagger, newSwagger);

        var hasChanges = swagger.swaggerVersioning().updateVersionFile(swaggerDifferences, versionFileName);

        if(hasChanges){
            fs.writeFileSync(swaggerFileName, JSON.stringify(newSwagger));
            console.log(this.swaggerVersioning().getVersionString(swaggerFileName))
        }
    });
}
module.exports = swagger;
