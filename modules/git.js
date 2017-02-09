const nodegit = require('nodegit'); // http://www.nodegit.org/
const Q = require('q');



function Git() {

}


Git.prototype.clone = function(repo, branch, target) {
	var deferred = Q.defer();

	var options = {};

	if (branch) {
		options['checkoutBranch'] = branch;
	}

	/* GitHub certificate issue in OS X
	 * Unfortunately in OS X there is a problem where libgit2 is unable to look up GitHub certificates correctly. 
	 * In order to bypass this problem, we're going to passthrough the certificate check.
	 * http://www.nodegit.org/guides/cloning/ 
	 */
	if (process.platform == 'darwin') {
		options.fetchOpts = {
			callbacks: {
				certificateCheck: function() { return 1; }
			}
		};
	}

	// Clone repo
	nodegit.Clone(repo, target, options)
		.then((repository) => deferred.resolve(repository))
		.catch((err) => deferred.reject(err));

	return deferred.promise;
};



self = module.exports = new Git();