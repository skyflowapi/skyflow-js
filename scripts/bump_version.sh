echo "Bumping package version to $1-$2"

Version=$1
SEMVER=${Version:1}

if [ -z $2 ]
then
	sed -E "s/\"version\": .+/\"version\": \"$SEMVER\",/g" package.json > tempfile && cat tempfile > package.json && rm -f tempfile
else
	sed -E "s/\"version\": .+/\"version\": \"$SEMVER-$2\",/g" package.json > tempfile && cat tempfile > package.json && rm -f tempfile
fi

echo --------------------------
echo "Done, Package now at $SEMVER-$2"