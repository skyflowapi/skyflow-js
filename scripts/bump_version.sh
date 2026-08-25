Version=$1
PACKAGE_DIR=$2
SHA=$3
SEMVER=$Version

if [ -z "$PACKAGE_DIR" ]
then
	echo "Usage: bump_version.sh <version> <package-dir> [sha]" >&2
	echo "  e.g. bump_version.sh 2.7.9 packages/skyflow-js" >&2
	exit 1
fi

MANIFEST="$PACKAGE_DIR/package.json"

if [ ! -f "$MANIFEST" ]
then
	echo "No package.json found at $MANIFEST" >&2
	exit 1
fi

if [ -z "$SHA" ]
then
	echo "Bumping $PACKAGE_DIR version to $1"

	sed -E "s/\"version\": .+/\"version\": \"$SEMVER\",/g" "$MANIFEST" > tempfile && cat tempfile > "$MANIFEST" && rm -f tempfile
	echo --------------------------
	echo "Done, $PACKAGE_DIR now at $1"

else
	echo "Bumping $PACKAGE_DIR version to $1-dev.$SHA"

	sed -E "s/\"version\": .+/\"version\": \"$SEMVER-dev.$SHA\",/g" "$MANIFEST" > tempfile && cat tempfile > "$MANIFEST" && rm -f tempfile

	echo --------------------------
	echo "Done, $PACKAGE_DIR now at $1-dev.$SHA"
fi
