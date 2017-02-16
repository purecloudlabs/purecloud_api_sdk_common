const fs = require('fs-extra');
const path = require('path');


try {
	var swaggerCodegenConfigFilePath = process.argv[2];
	var version = require(path.resolve(process.argv[3]));
	var artifactId = process.argv[4];

	var config = {
			"artifactId": artifactId || "platform-client",
			"artifactVersion": version.displayFull,
			"apiPackage": "com.mypurecloud.sdk.api",
			"modelPackage": "com.mypurecloud.sdk.model",
			"invokerPackage": "com.mypurecloud.sdk",
			"groupId": "com.mypurecloud",
			"localVariablePrefix": "pc",
			"serializableModel": "true",
			"hideGenerationTimestamp": "false",
	    	"httpUserAgent":"PureCloud SDK",
			"packageDescription":"The official Java SDK for the PureCloud Platform API SDK",
			"packageUrl":"https://developer.mypurecloud.com/api/rest/client-libraries/java/latest/"
		};

	fs.writeFileSync(swaggerCodegenConfigFilePath, JSON.stringify(config, null, 2));
	console.log(`Config file written to ${swaggerCodegenConfigFilePath}`);
} catch(err) {
	process.exitCode = 1;
	console.log(err);
}