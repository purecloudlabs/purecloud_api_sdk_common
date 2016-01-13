var fs = require('fs');

describe("Major breaking changes", function(){
    //Major
    // removed methods - DONE
    // different signatures
    // removed paths - DONE
    // properties removed from model - DONE
    // Changed property type - DONE
    // Changed property format - DONE
    // operation id changed - DONE
    // return errors changed/added/removed

    beforeEach(function(){
        breakingChanges = require('../lib/swagger_versioning.js')();
    });

    it("if the number of parameters is different", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedOperationParameterCount;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if parameters name is different", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedOperationParameterFieldName;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);

        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if parameters Required field is different", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedOperationParameterFieldRequired;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if parameters Type field is different", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedOperationParameterFieldType;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if parameters Format field is different", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedOperationParameterFieldFormat;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if a return type was changed", function() {

        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedResponseType;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if a return type was removed", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.removedReturnType;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if tags were removed", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.removedTag;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);

        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if a path was removed", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/pathTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.removedPath;

        var breaking = breakingChanges.checkPaths(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if a changed operation id was changed", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedOperationId;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("if a model is removed", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/modelTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.modelNotDefined;

        var breaking = breakingChanges.checkModels(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("for a changed property type", function() {
        var swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/modelTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedPropertyType;

        var breaking = breakingChanges.checkModels(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });

    it("for a changed property format", function() {
        var swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/modelTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedFormat;

        var breaking = breakingChanges.checkModels(oldSwagger,newSwagger);
        expect(breaking["Major"]).not.toBeNull();
        expect(breaking["Major"].length).toBe(1);
    });
});

describe("Minor point breaking changes", function(){
    //Minor
    // added methods -
    // added paths - DONE
    // properties added to model


    beforeEach(function(){
        breakingChanges = require('../lib/swagger_versioning.js')()
    });

    it("if tags were added", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.addedTag;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);

        expect(breaking["Minor"]).not.toBeNull();
        expect(breaking["Minor"].length).toBe(1);
    });

    it("if a path is added", function() {
        var swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/pathTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.addedPath;

        var breaking = breakingChanges.checkPaths(oldSwagger,newSwagger);
        expect(breaking["Minor"]).not.toBeNull();
        expect(breaking["Minor"].length).toBe(1);
    });

    it("if methods for a path were added", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.methodAddedToPath;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(breaking["Minor"]).not.toBeNull();
        expect(breaking["Minor"].length).toBe(1);
    });

    it("if properties were added to a model", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/modelTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.addedModelProperty;

        var breaking = breakingChanges.checkModels(oldSwagger,newSwagger);
        expect(breaking["Minor"]).not.toBeNull();
        expect(breaking["Minor"].length).toBe(1);
    });

});

describe("Warning changes", function(){
    //Warning
    // Description changes
    // summary changes

    it("if operation description was changed", function() {
        var swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedOperationDescription;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);

        expect(breaking["Point"]).not.toBeNull();
        expect(breaking["Point"].length).toBe(1);
    });

    it("if operation summary was changed", function() {
        var swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.operationSummaryChanged;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);

        expect(breaking["Point"]).not.toBeNull();
        expect(breaking["Point"].length).toBe(1);
    });

    it("if operation response description was changed", function() {
        var swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedReturnDescription;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);

        expect(breaking["Point"]).not.toBeNull();
        expect(breaking["Point"].length).toBe(1);
    });

});

describe("No Changes", function(){
    beforeEach(function(){
        breakingChanges = require('../lib/swagger_versioning.js')()
    });

    it("should not have any changes in methods", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.base;

        var breaking = breakingChanges.checkOperations(oldSwagger,newSwagger);
        expect(Object.keys(breaking).length).toBe(0);
    });

    it("should not show any breaking models", function() {
        swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/modelTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.base;

        var breaking = breakingChanges.checkModels(oldSwagger,newSwagger);
        expect(Object.keys(breaking).length).toBe(0);
    });

});

describe("test merge of all", function(){

    it("if operation response description was changed", function() {
        breakingChanges = require('../lib/swagger_versioning.js')()
        var swaggerDefinitions = JSON.parse(fs.readFileSync("./spec/swaggerDefinitions/operationTests.json", 'UTF-8'));

        var oldSwagger = swaggerDefinitions.base;
        var newSwagger = swaggerDefinitions.changedReturnDescription;

        var breaking = breakingChanges.checkAll(oldSwagger,newSwagger);

        expect(breaking["Point"]).not.toBeNull();
        expect(breaking["Point"].length).toBe(1);
    });
});

describe("test generate readme", function(){
    it("should show a point release", function() {
        versioning = require('../lib/swagger_versioning.js')()

        var changeDescription=  "SOMETHING CHANGED";
        var changeLog = {
            "Major" : [changeDescription],
            "Minor" : [],
            "Point" :[]
        }

        var changelog = versioning.getChangeReadmeText(changeLog);
        expect(changelog.indexOf("Breaking Changes")).toBeGreaterThan(-1);
        expect(changelog.indexOf("Additions")).toBe(-1);
        expect(changelog.indexOf("Other Changes")).toBe(-1);
        expect(changelog.indexOf(changeDescription)).toBeGreaterThan(-1);
        
    });
    it("should show a point release", function() {
        versioning = require('../lib/swagger_versioning.js')()

        var changeDescription=  "SOMETHING CHANGED";
        var changeLog = {
            "Major" : [],
            "Minor" : [changeDescription],
            "Point" :[]
        }

        var changelog = versioning.getChangeReadmeText(changeLog);
        expect(changelog.indexOf("Breaking Changes")).toBe(-1);
        expect(changelog.indexOf("Additions")).toBeGreaterThan(-1);
        expect(changelog.indexOf("Other Changes")).toBe(-1);
        expect(changelog.indexOf(changeDescription)).toBeGreaterThan(-1);

    });

    it("should show a point release", function() {
        versioning = require('../lib/swagger_versioning.js')()

        var changeDescription=  "SOMETHING CHANGED";
        var changeLog = {
            "Major" : [],
            "Minor" : [],
            "Point" :[changeDescription]
        }

        var changelog = versioning.getChangeReadmeText(changeLog);
        expect(changelog.indexOf("Breaking Changes")).toBe(-1);
        expect(changelog.indexOf("Additions")).toBe(-1);
        expect(changelog.indexOf("Other Changes")).toBeGreaterThan(-1);
        expect(changelog.indexOf(changeDescription)).toBeGreaterThan(-1);

    });
});
