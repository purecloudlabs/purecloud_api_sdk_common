var pclibSwaggerVersion = require('./lib/app.js').swaggerVersioning();

var version = pclibSwaggerVersion.getVersionString("version.json");
console.log(version);
