var fs = require('fs');

const VERSION_FILE_PATH_INDEX = 2;
const VERSION = 3;

if (process.argv.length <= VERSION){
    console.log("USAGE: node print_version_changelog <versionfilepath>");
    process.exit(1);
}

var pclib = require('./lib/app.js');
var pclibSwaggerVersion = pclib.swaggerVersioning();


version = JSON.parse(fs.readFileSync(process.argv[VERSION_FILE_PATH_INDEX], 'UTF-8'))

var notes = pclibSwaggerVersion.getChangeReadmeText(version.changelog[process.argv[VERSION]]);
console.log(notes);
