

describe("Test Added/Removed paths", function() {
    beforeEach(function(){
        breakingChanges = require('../lib/breaking_changes.js')()
    });
    
  it("should have 1 failed path", function() {
      var oldSwagger = JSON.parse("swaggerDefinitions/base.json");
      var newSwagger = JSON.parse("swaggerDefinitions/removedUrls.json");

      var removed = breakingChanges.getRemovedPaths(oldSwagger,newSwagger);
  });
});
