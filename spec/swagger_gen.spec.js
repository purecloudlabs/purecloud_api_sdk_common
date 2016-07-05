var fs = require('fs');

describe("download swagger file", function(){
    beforeEach(function(){
        swaggerGen = require('../lib/swagger_gen.js')();
    });

    it("Should be able to download from mypurecloud.com", function(){
        swaggerGen.downloadSwaggerFile("mypurecloud.com", function(swagger){
            expect(swagger).not.toBe(null);
            expect(swagger.info).not.toBe(null);
        });
    });

    it("Should be able to download from a full url", function(){
        swaggerGen.downloadSwaggerFile("https://api.mypurecloud.com/v1/docs/swagger", function(swagger){
            expect(swagger).not.toBe(null);
            expect(swagger.info).not.toBe(null);
        });
    });
});

describe("sanitize operations", function(){

    function getOperationId(swagger, uri, httpMethod){
        console.log(JSON.stringify(swagger));
        return swagger.paths[uri][httpMethod].operationId;
    }

    beforeEach(function(){
        swaggerGen = require('../lib/swagger_gen.js')();
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/swagger_gen.json", 'UTF-8'));
    });

    it("should copy x-inin-method-name to operation id", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/outbound/campaigns/{campaignId}", "get");

        expect(operationId).toBe("getCarrierservicesNumberpurchaseOrder");
    });

    it("should remove models", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/outbound/campaigns/{campaignId}", "get");

        expect(swagger.definitions.TestModel2).toBeDefined();
        expect(swagger.definitions.TestModel2).toBeDefined();
        expect(swagger.definitions.Queue).toBeDefined();
        expect(swagger.definitions.AdditionalPropertiesModel).toBeDefined();

        expect(swagger.definitions.UnUsedModel).not.toBeDefined();
    });

});
