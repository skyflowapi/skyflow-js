#!/usr/bin/env bash
set -euo pipefail

README="$1"
VERSION="$2"

MARKER_START="<!-- SKYFLOW-BETA-DISCLAIMER:START -->"
MARKER_END="<!-- SKYFLOW-BETA-DISCLAIMER:END -->"

TEMP_FILE=$(mktemp)

# Check if version is beta
if [[ "$VERSION" =~ beta ]]; then
    # Remove existing banner if present
    if grep -q -F "$MARKER_START" "$README"; then
        sed "/$MARKER_START/,/$MARKER_END/d" "$README" > "$TEMP_FILE"
    else
        cp "$README" "$TEMP_FILE"
    fi

    # Insert banner after the first line (title)
    awk "NR==1 {print; print \"$MARKER_START\"; print \"> **Beta Disclaimer:** This is a beta release. Features may change before general availability.\"; print \"$MARKER_END\"; next} 1" "$TEMP_FILE" > "$README"
else
    # Remove banner if present
    if grep -q -F "$MARKER_START" "$README"; then
        sed "/$MARKER_START/,/$MARKER_END/d" "$README" > "$TEMP_FILE"
        mv "$TEMP_FILE" "$README"
    fi
fi

rm -f "$TEMP_FILE"
