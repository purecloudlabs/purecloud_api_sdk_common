var api = require('github-api-promise');
var dateFormat = require('dateformat');
var fs = require('fs');
var Q = require('q');

var dFormat = 'dddd, mmmm dS yyyy';
var tFormat = 'h:MM:ss TT';

api.config.owner = 'MyPureCloud';

module.exports = function(){
    function uploadReleaseAsset(uploadUrl, fileName, label, filePath, mimeType) {
    	api.repos.releases.uploadReleaseAsset(uploadUrl, fileName, label, filePath, mimeType)
    		.then(function(res) {
    			logAsset(res, 'Uploaded ');
    		},
    		function(err) {
    			console.log('Request failed: ' + err);
    		});
    }

    // Log a single release
    function logRelease(release, prefix) {
    	if (prefix) {
    		if (prefix.substring(prefix.length - 1) != ' ') {
    			prefix += ' ';
    		}
    	} else {
    		prefix = '';
    	}
    	console.log(prefix + 'release #' + release.id + ', "' + release.name + '", tag: ' + release.tag_name + ', published on ' + dateFormat(release.published_at, dFormat) + ' at ' + dateFormat(release.published_at, tFormat));
    }

    // Log a single asset
    function logAsset(asset) {
    	console.log('Asset "' + asset.name + '" (' + asset.label + ') #' + asset.id + ' uploaded by ' + asset.uploader.login + ' on ' + dateFormat(asset.updated_at, dFormat) + ' at ' + dateFormat(asset.updated_at, tFormat));
    }

    return {
        release : function (token, repo, version, releaseNotes, zipFileName, zipFilePath){
            api.config.repo = repo;
            api.config.token = token;

            var createReleaseOptions = {
				"tag_name": version,
				"target_commitish": "master",
				"name": version,
				"body": "Jenkins build " + version +"\n " + releaseNotes,
				"draft": false,
				"prerelease": false
			};

			api.repos.releases.createRelease(createReleaseOptions)
				.then(function(res) {
					logRelease(res, 'Created ');
                    if(zipFileName && zipFilePath){
                        uploadReleaseAsset(res.upload_url, zipFileName, 'Release binaries', zipFilePath, 'application/zip');
                    }
				},
				function(err) {
					console.log('Request failed: ' + err);
					throw err;
				});
        }
    };
}
