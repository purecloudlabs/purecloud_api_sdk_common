const _ = require('lodash');
const archiver = require('archiver');
const childProcess = require('child_process');
const fs = require('fs-extra');
const moment = require('moment-timezone');
const Winston = require('winston');
const path = require('path');
const Q = require('q');

const swaggerDiff = require('./swaggerDiff');
const git = require('./gitModule');


/* PRIVATE VARS */

var newSwaggerTempFile = '';
var releaseNoteTemplatePath = './resources/templates/releaseNoteSummary.md';
var log;


/* CONSTRUCTOR */

function Builder(config) {
	try {
		this.config = config;
		self = this;

		// Checketh thyself before thou wrecketh thyself
		maybeInit(this, 'config', {});
		maybeInit(this.config, 'version', {major:0,minor:0,point:0,prerelease:''}, 'Version not set. Initializing to 0.0.0');
		maybeInit(this.config, 'settings', {});
		maybeInit(this.config.settings, 'swagger', {});
		maybeInit(this.config, 'stageSettings', {});
		maybeInit(this.config.stageSettings, 'prebuild', {});
		maybeInit(this.config.stageSettings, 'build', {});
		maybeInit(this.config.stageSettings, 'postbuild', {});

		// Check for required settings
		checkAndThrow(this.config.settings, 'sdkRepo');
		checkAndThrow(this.config.settings.swagger, 'oldSwaggerPath');
		checkAndThrow(this.config.settings.swagger, 'newSwaggerPath');

		// https://github.com/winstonjs/winston#logging-levels
		// silly > debug > verbose > info > warn > error
		var logLevel = this.config.settings.logLevel ? this.config.settings.logLevel : 'debug';
		log = new Winston.Logger({
		    transports: [
		        new Winston.transports.Console({
		            level: logLevel,
		            handleExceptions: true,
		            json: false,
		            colorize: true
		        })
		    ]
		});
		console.log(`Log level is ${logLevel}`);

		// Set env vars
		setEnv('SDK_REPO', path.join('./output', this.config.settings.swaggerCodegen.language));
		fs.mkdirp(getEnv('SDK_REPO'));
		setEnv('SDK_TEMP', path.join('./temp', this.config.settings.swaggerCodegen.language));
		fs.mkdirp(getEnv('SDK_TEMP'));

		// Load env vars from config
		_.forOwn(this.config.envVars, (value, key) => setEnv(key, value));

		// Resolve env vars in config
		resolveEnvVars(this.config);
		if (this.config.settings.debugConfig === true)
			log.debug('Config file: \n' + JSON.stringify(this.config,null,2));

		// Initialize instance vars
		var resourceRoot = `./resources/sdk/${this.config.settings.swaggerCodegen.language}/`;
		this.resourcePaths = {
			extensions: path.join(resourceRoot, 'extensions'),
			scripts: path.join(resourceRoot, 'scripts'),
			templates: path.join(resourceRoot, 'templates')
		};
		newSwaggerTempFile = path.join(getEnv('SDK_TEMP'), 'newSwagger.json');
	} catch(err) {
		log.error(err);
		throw err;
	}
}


/* PUBLIC PROPERTIES */

Builder.prototype.config = {};
Builder.prototype.repository = {};


/* PUBLIC FUNCTIONS */

Builder.prototype.fullBuild = function() {
	var deferred = Q.defer();

	log.info('Full build initiated!');

	this.prebuild()
		.then(() => this.build())
		.then(() => this.postbuild())
		.then(() => log.info('Full build complete'))
		.then(() => deferred.resolve())
		.catch((err) => deferred.reject(err));

	return deferred.promise;
};

Builder.prototype.prebuild = function() {
	var deferred = Q.defer();

	log.info('===================');
	log.info('= STAGE: prebuild =');
	log.info('===================');

	prebuildImpl()
		.then(() => log.info('Stage complete: prebuild'))
		.then(() => deferred.resolve())
		.catch((err) => deferred.reject(err));

	return deferred.promise;
};

Builder.prototype.build = function() {
	var deferred = Q.defer();

	log.info('================');
	log.info('= STAGE: build =');
	log.info('================');

	buildImpl()
		.then(() => log.info('Stage complete: build'))
		.then(() => deferred.resolve())
		.catch((err) => deferred.reject(err));

	return deferred.promise;
};

Builder.prototype.postbuild = function() {

};


/* EXPORT MODULE */

module.exports = Builder;


/* IMPL FUNCTIONS */

function prebuildImpl() {
	var deferred = Q.defer();

	//log.debug(self);

	// Pre-run scripts
	executeScripts(self.config.stageSettings.prebuild.preRunScripts, 'custom prebuild pre-run');

	// Prepare for repo clone
	var sdkRepo = self.config.settings.sdkRepo;
	var repo, branch;

	// Check for basic or extended config
	if (typeof(sdkRepo) == 'string') {
		repo = sdkRepo;
	} else {
		repo = sdkRepo.repo;
		branch = sdkRepo.branch;
	}

	// Clone repo
	var startTime = moment();
	log.info(`Cloning ${repo} (${branch}) to ${getEnv('SDK_REPO')}`);
	fs.removeSync(getEnv('SDK_REPO'));
	git.clone(repo, branch, getEnv('SDK_REPO'))
		.then(function(repository) {
			log.debug(`Clone operation completed in ${moment.duration(moment().diff(startTime, new moment())).humanize()}`);
			self.repository = repository;
		})
		.then(function() {
			// Diff swagger
			log.info('Diffing swagger files...');
			swaggerDiff.useSdkVersioning = true;
			swaggerDiff.getAndDiff(
				self.config.settings.swagger.oldSwaggerPath, 
				self.config.settings.swagger.newSwaggerPath, 
				self.config.settings.swagger.saveOldSwaggerPath,
				self.config.settings.swagger.saveNewSwaggerPath);

			// Save new swagger to temp file for build
			log.info(`Writing new swagger file to temp storage path: ${newSwaggerTempFile}`);
			fs.writeFileSync(newSwaggerTempFile, JSON.stringify(swaggerDiff.newSwagger));
		})
		.then(function() {
			//TODO: add in notifications!!!
		})
		.then(function() {
			// Increment version in config
			log.debug(`Previous version: ${swaggerDiff.stringifyVersion(self.config.version)}`);
			swaggerDiff.incrementVersion(self.config.version);
			log.info(`New version: ${swaggerDiff.stringifyVersion(self.config.version)}`);
		})
		.then(function() {
			// Get release notes
			log.info('Generating release notes...');
			self.releaseNotes = swaggerDiff.generateReleaseNotes(releaseNoteTemplatePath);
		})
		.then(() => executeScripts(self.config.stageSettings.prebuild.postRunScripts, 'custom prebuild post-run'))
		.then(() => deferred.resolve())
		.catch((err) => deferred.reject(err));

	return deferred.promise;
}

function buildImpl() {
	var deferred = Q.defer();

	// Pre-run scripts
	executeScripts(self.config.stageSettings.build.preRunScripts, 'custom build pre-run');

	var outputDir = path.join(getEnv('SDK_REPO'), 'build');
	log.debug(`SDK build dir -> ${outputDir}`);
	fs.emptyDirSync(outputDir);


	var command = '';
	// Java command and options
	command += `java ${getEnv('JAVA_OPTS')} -XX:MaxPermSize=256M -Xmx1024M -DloggerPath=conf/log4j.properties `;
	// Swagger-codegen jar file
	command += `-jar ${self.config.settings.swaggerCodegen.jarPath} `;
	// Swagger-codegen options
	command += `generate `;
	command += `-i ${newSwaggerTempFile} `;
	command += `-l ${self.config.settings.swaggerCodegen.language} `;
	command += `-o ${outputDir} `;
	command += `-c ${self.config.settings.swaggerCodegen.configFile} `;
	command += `-t ${self.resourcePaths.templates}`;
	_.forOwn(self.config.settings.swaggerCodegen.extraGeneratorOptions, (option) => command += ' ' + option);

	log.info('Running swagger-codegen...');
	log.debug(command);
	var code = childProcess.execSync(command);

	log.info('Copying extensions...');
	fs.copySync(this.resourcePaths.extensions, self.config.settings.extensionsDestination);

	// Run compile scripts
	executeScripts(this.config.stageSettings.build.compileScripts, 'compile');

	log.info('Copying readme...');
	fs.createReadStream(path.join(getEnv('SDK_REPO'), 'README.md'))
		.pipe(fs.createWriteStream(path.join(getEnv('SDK_REPO'), 'build/docs/index.md')));

	log.info('Zipping docs...');
	zip(path.join(outputDir, 'docs'), path.join(getEnv('SDK_TEMP'), 'docs.zip'))
		.then(function() {
			log.info('Committing SDK repo...');
			// TODO: commit to git
		})
		.then(() => executeScripts(self.config.stageSettings.build.postRunScripts, 'custom build post-run'))
		.then(() => deferred.resolve())
		.catch((err) => deferred.reject(err));

	return deferred.promise;
}


/* PRIVATE FUNCTIONS */

function executeScripts(scripts, phase) {
	if (!scripts) return;
	log.info(`Executing ${lenSafe(scripts)} ${phase ? phase.trim() + ' ' : ''}scripts...`);
	_.forEach(scripts, function(script) { executeScript(script); });
}

function executeScript(script) {
	var code = -100;
	var startTime = moment();

	try {
		var args = script.args ? script.args : [];
		args.unshift(script.path);

		log.verbose(`Executing ${script.type} script as: ${args.join(' ')}`);

		switch (script.type.toLowerCase()) {
			case 'node': {
				code = childProcess.execFileSync('node', args, {stdio:'inherit'});
				break;
			}
			case 'shell': {
				code = childProcess.execFileSync('sh', args, {stdio:'inherit'});
				break;
			}
			default: {
				log.warn(`UNSUPPORTED SCRIPT TYPE: ${script.type}`);
				return 1;
			}
		}

		if (!code || code === null)
			code = 0;
	} catch (err) {
		if (err.error)
			log.error(err.error);

		if (err.status)
			code = err.status;
	}

	log.verbose(`Script completed with return code ${code} in ${moment.duration(moment().diff(startTime, new moment())).humanize()}`);
	return code;
}

function lenSafe(arr) {
	return arr ? arr.length : 0;
}

function maybeInit(haystack, needle, defaultValue, warning) {
	if (!haystack) {
		log.warn('Haystack was undefined!');
		return;
	}
	if (!haystack[needle]) {
		if (warning) 
			log.warn(warning);

		haystack[needle] = defaultValue;
	}
}

function checkAndThrow(haystack, needle, message) {
	if (!haystack[needle] || haystack[needle] === '')
		throw new Error(message ? message : `${needle} must be set!`);
}

function getEnv(varname) {
	varname = varname.trim();
	log.silly(`ENV: ${varname}->${process.env[varname]}`);
	return process.env[varname] ? process.env[varname] : '';
}

function setEnv(varname, value) {
	varname = varname.trim();
	log.silly(`ENV: ${varname}=${value}`);
	process.env[varname] = value;
}

function resolveEnvVars(config) {
	_.forOwn(config, function(value, key) {
		if (typeof(value) == 'string') {
			config[key] = value.replace(/\$\{(.+?)\}/gi, function(match, p1, offset, string) {
				return getEnv(p1);
			});
		} else {
			resolveEnvVars(value);
		}
	});
}

function zip(inputDir, outputPath) {
	var deferred = Q.defer();

	var output = file_system.createWriteStream(outputPath);
	var archive = archiver('zip');

	output.on('close', function () {
	    console.log(archive.pointer() + ' total bytes');
	    console.log('archiver has been finalized and the output file descriptor has closed.');
	    deferred.resolve();
	});

	archive.on('error', function(err){
	    deferred.reject(err);
	});

	archive.pipe(output);
	archive.directory(inputDir);
	archive.finalize();

	return deferred.promise;
}