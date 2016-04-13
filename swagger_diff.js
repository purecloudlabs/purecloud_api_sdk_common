
var fs = require('fs');

const SWAGGER_INDEX_OLD = 2;
const SWAGGER_INDEX_NEW = 3;

if (process.argv.length <= SWAGGER_INDEX_NEW){
    console.log("USAGE: node swagger_diff oldfile newfile");
    process.exit(1);
}

var pclib = require('./lib/app.js');
var pclibSwaggerVersion = pclib.swaggerVersioning();

swaggerOld = JSON.parse(fs.readFileSync(process.argv[SWAGGER_INDEX_OLD], 'UTF-8'));
swaggerNew = JSON.parse(fs.readFileSync(process.argv[SWAGGER_INDEX_NEW], 'UTF-8'));

diffs = pclibSwaggerVersion.checkAll(swaggerOld,swaggerNew);

console.log(JSON.stringify(diffs,null, 2));
