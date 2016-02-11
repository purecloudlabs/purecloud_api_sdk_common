var release = require('./lib/create_release')();

var version = '0.0.0.0';
var token, zipFileName, zipFilePath, releaseNotes = null;


// Parse args
process.argv.forEach(function (val, index, array) {
    if (stringStartsWith(val, '/version=')) {
        version = val.substring(9);
    } else if (stringStartsWith(val, '/token=')) {
        token = val.substring(7);
    }
    else if (stringStartsWith(val, '/releasenotes=')) {
        releaseNotes = val.substring(14);
    }
    else if (stringStartsWith(val, '/zipfilename=')) {
        zipFileName = val.substring(13);
    }
    else if (stringStartsWith(val, '/zipfilepath=')) {
        zipFilePath = val.substring(13);
    }
});

release.release(token, repo, version, releaseNotes, zipFileName, zipFilePath);
