var pclibSwaggerVersion = require('PureCloudApiLibraries').swaggerVersioning();

var version = pclibSwaggerVersion.getVersionString("version.json");
console.log(version);
