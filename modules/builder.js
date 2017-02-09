const _ = require('lodash');
const archiver = require('archiver');
const childProcess = require('child_process');
const fs = require('fs-extra');
const git = require('git');
const log = require('winston');
const path = require('path');
const Q = require('q');

const swaggerDiff = require('./modules/swaggerDiff');


/* PRIVATE VARS */

var newSwaggerTempFile = '';
var releaseNoteTemplatePath = './resources/templates/releaseNoteSummary.md';


/* CONSTRUCTOR */

function Builder(config) {
	this.config = config;

	// Checketh thyself before thou wrecketh thyself
	maybeInit(this, 'config', {});
	maybeInit(this.config, 'version', {major:0,minor:0,point:0,prerelease:''}, 'Version not set. Initializing to 0.0.0');
	maybeInit(this.config, 'settings', {});
	maybeInit(this.config, 'stageSettings', {});
	maybeInit(this.config.stageSettings, 'prebuild', {});
	maybeInit(this.config.stageSettings, 'build', {});
	maybeInit(this.config.stageSettings, 'postbuild', {});

	// Check for required settings
	checkAndThrow(this.config.settings, 'sdkRepo');
	checkAndThrow(this.config.settings, 'oldSwaggerPath');
	checkAndThrow(this.config.settings, 'newSwaggerPath');

	// https://github.com/winstonjs/winston#logging-levels
	if (this.config.logLevel) {
		log.info(`Setting log level to ${this.config.logLevel}`);
		log.level = this.config.logLevel;
	}

	// Set env vars
	env('SDK_REPO', 'some/folder/path');
	env('SDK_TEMP', 'some/folder/path');

	// Load env vars from config
	_.forOwn(this.config.envVars, (value, key) => env(key, value));

	// Initialize instance vars
	var resourceRoot = `./resources/sdk/${self.config.settings.swagger.language}/`;
	this.resourcePaths = {
		extensions: path.join(resourceRoot, 'extensions'),
		scripts: path.join(resourceRoot, 'scripts'),
		templates: path.join(resourceRoot, 'templates')
	};
	newSwaggerTempFile = path.join(env('SDK_TEMP'), 'newSwagger.json');
}


/* PUBLIC PROPERTIES */

Builder.prototype.config = {};
Builder.prototype.repository = {};


/* PUBLIC FUNCTIONS */

Builder.prototype.fullBuild = function() {

};

Builder.prototype.prebuild = function() {
	var deferred = Q.defer();

	prebuildImpl()
		.then(() => deferred.resolve())
		.catch((err) => deferred.reject(err));

	return deferred.promise;
};

Builder.prototype.build = function() {
	var deferred = Q.defer();

	buildImpl()
		.then(() => deferred.resolve())
		.catch((err) => deferred.reject(err));

	return deferred.promise;
};

Builder.prototype.postbuild = function() {

};


/* EXPORT MODULE */

self = module.exports = Builder;


/* IMPL FUNCTIONS */

function prebuildImpl() {
	var deferred = Q.defer();

	// Pre-run scripts
	executeScripts(config.stageSettings.prebuild.preRunScripts, 'custom prebuild pre-run');

	// Prepare for repo clone
	var sdkRepo = self.config.settings.sdkRepo;
	var repo, branch;

	if (!sdkRepo) {
		throw new Exception('sdkRepo property was not set! Aborting!');
	}

	// Check for basic or extended config
	if (typeof(sdkRepo) == 'string') {
		repo = sdkRepo;
	} else {
		repo = sdkRepo.repo;
		branch = sdkRepo.branch;
	}

	// Clone repo
	git.clone(repo, branch, env('SDK_REPO'))
		.then(function(repository) {
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
		.then(() => executeScripts(config.stageSettings.prebuild.postRunScripts, 'custom prebuild post-run'))
		.then(() => deferred.resolve())
		.catch((err) => deferred.reject(err));

	return deferred.promise;
}

function buildImpl() {
	var deferred = Q.defer();

	// Pre-run scripts
	executeScripts(config.stageSettings.build.preRunScripts, 'custom build pre-run');

	var outputDir = path.join(env('SDK_REPO'), 'build');
	log.debug(`SDK build dir -> ${outputDir}`);
	fs.emptyDirSync(outputDir);


	var command = '';
	// Java command and options
	command += `java ${env('JAVA_OPTS')} -XX:MaxPermSize=256M -Xmx1024M -DloggerPath=conf/log4j.properties `;
	// Swagger-codegen jar file
	command += `-jar ${self.config.settings.swaggerCodegenJarPath} `;
	// Swagger-codegen options
	command += `generate `;
	command += `-i ${newSwaggerTempFile} `;
	command += `-l ${self.config.settings.swagger.language} `;
	command += `-o ${outputDir} `;
	command += `-c ${self.config.stageSettings.build.swaggerCodegenConfigFile} `;
	command += `-t ${self.resourcePaths.templates}`;
	_.forOwn(self.config.settings.swagger.extraGeneratorOptions, (option) => command += ' ' + option);

	log.info('Running swagger-codegen...');
	var code = childProcess.execSync(command);

	log.info('Copying extensions...');
	fs.copySync(this.resourcePaths.extensions, self.config.settings.extensionsDestination);

	// Run compile scripts
	executeScripts(this.config.stageSettings.build.compileScripts, 'compile');

	log.info('Copying readme...');
	fs.createReadStream(path.join(env('SDK_REPO'), 'README.md'))
		.pipe(fs.createWriteStream(path.join(env('SDK_REPO'), 'build/docs/index.md')));

	log.info('Zipping docs...');
	zip(path.join(outputDir, 'docs'), path.join(env('SDK_TEMP'), 'docs.zip'))
		.then(function() {
			log.info('Committing SDK repo...');
			// TODO: commit to git
		})
		.then(() => executeScripts(config.stageSettings.build.postRunScripts, 'custom build post-run'))
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
	var args = script.args ? script.args : [];
	args.push(script.path);

	log.info(`Executing ${script.type} script as: ${args}`);

	switch (script.type.toLowerCase()) {
		case 'node': {
			code = childProcess.execFileSync('node', args);
			break;
		}
		case 'shell': {
			code = childProcess.execFileSync('sh', args);
			break;
		}
		default: {
			console.log(`UNSUPPORTED SCRIPT TYPE: ${script.type}`);
			return 1;
		}
	}
	
	log.debug(`Process completed with return code ${code}`);
	return code;
}

function lenSafe(arr) {
	return arr ? arr.length : 0;
}

function maybeInit(haystack, needle, defaultValue, warning) {
	if (!haystack[needle]) {
		if (warning) 
			log.warn(warning);

		haystack[needle] = defaultValue;
	}
}

function checkAndThrow(haystack, needle, message) {
	if (!haystack[needle] || haystack[needle] === '')
		throw new Exception(message ? message : `${needle} must be set!`);
}

function env(varname) {
	log.debug(`ENV: ${varname}->${process.env[varname]}`);
	return process.env[varname];
}

function env(varname, value) {
	log.debug(`ENV: ${key}=${value}`);
	process.env[varname] = value;
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