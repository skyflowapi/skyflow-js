Version=$1
SEMVER=$Version

if [ -z $2 ]
then
	echo "Bumping package version to $1"

	sed -E "s/\"version\": .+/\"version\": \"$SEMVER\",/g" package.json > tempfile && cat tempfile > package.json && rm -f tempfile
	echo --------------------------
	echo "Done, Package now at $1"

else
	echo "Bumping package version to $1-dev.$2"

	sed -E "s/\"version\": .+/\"version\": \"$SEMVER-dev.$2\",/g" package.json > tempfile && cat tempfile > package.json && rm -f tempfile

	echo --------------------------
	echo "Done, Package now at $1-dev.$2"
fi