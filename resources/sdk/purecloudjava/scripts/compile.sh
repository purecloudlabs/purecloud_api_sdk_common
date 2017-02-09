# Compile module
cd $REPO/build

echo "BUILD_MODE=$BUILD_MODE"
if [ $BUILD_MODE == "verify" ]
then
	# Build and sign
	mvn --settings $MAVEN_SETTINGS_FILE verify -Dgpg.passphrase=$DPGP_PASSPHRASE
elif [ $BUILD_MODE == "deploy" ]
then
	# Build, sign, deploy to sonatype, and release to maven central
	mvn --settings $MAVEN_SETTINGS_FILE deploy -Dgpg.passphrase=$DPGP_PASSPHRASE
else
	# Default, just build
	mvn package
fi