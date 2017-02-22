const _ = require('lodash');
const spawn = require('child_process').spawn;
const Q = require('q');

const log = require('./logger');



function Git() {

}


Git.prototype.clone = function(repo, branch, target) {
	var deferred = Q.defer();

	try {
		var args = [];
		args.push('clone');
		args.push('--quiet');
		args.push('--progress');
		if (branch) {
			args.push('--branch');
			args.push(branch);
		}
		args.push('--depth');
		args.push('1');
		args.push(repo);
		args.push(target);

		log.debug(`Spawn: git ${args.join(' ')}`);

		var cmd = spawn('git', args, { stdio: 'inherit' });
		
		cmd.on('error', (err) => {
			log.error(`Git clone failed: ${err.message}`);
			deferred.reject(err);
		});

		cmd.on('close', (code) => {
			log.info(`Process exited with code ${code}`);
			if (code === 0)
				deferred.resolve();
			else
				deferred.reject(new Error(`git clone exited with code ${code}`));
		});

	} catch(err) {
		deferred.reject(err);
	}

	return deferred.promise;
};



self = module.exports = new Git();