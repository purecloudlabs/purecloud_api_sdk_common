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

    it("should handle redundant paths", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/outbound/campaigns/{campaignId}", "get");

        expect(operationId).toBe("getCampaign");
    });

    it("should handle if path param is just ID", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/users/someuser/{id}", "get");

        expect(operationId).toBe("getSomeuserId");
    });

    it("should handle if path with multiple params", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/outbound/campaigns/{campaignId}/somethings/{somethingid}", "get");

        expect(operationId).toBe("getCampaignSomethingsBySomethingid");
    });

    it("should handle non named segments", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/telephony/bootstrap/phones/{id}/{path}/{file}", "get");

        expect(operationId).toBe("getBootstrapPhonesIdByPathByFile");
    });

    it("should handle duplicate routes", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/outbound/duplicate/Route", "get");
        expect(operationId).toBe("getDuplicateRoute");

        var operationId = getOperationId(swagger, "/api/v1/inbound/duplicate/Route", "get");
        expect(operationId).toBe("getInboundDuplicateRoute");
    });

    it("should handle HTTP GET", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/test/httpmethod", "get");
        expect(operationId).toBe("getHttpmethod");
    });

    it("should handle HTTP DELETE", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/test/httpmethod", "delete");
        expect(operationId).toBe("deleteHttpmethod");
    });

    it("should handle HTTP POST", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/test/httpmethod", "post");
        expect(operationId).toBe("createHttpmethod");
    });

    it("should handle HTTP PUT", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/test/httpmethod", "put");
        expect(operationId).toBe("updateHttpmethod");
    });

    it("should handle HTTP PATCH", function(){
        var swagger = swaggerGen.sanitizeSwagger(swaggerDefinitions);
        var operationId = getOperationId(swagger, "/api/v1/test/httpmethod", "patch");
        expect(operationId).toBe("patchHttpmethod");
    });
});
