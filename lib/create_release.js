var api = require('github-api-promise');
var dateFormat = require('dateformat');
var fs = require('fs');
var archiver = require('archiver');
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
