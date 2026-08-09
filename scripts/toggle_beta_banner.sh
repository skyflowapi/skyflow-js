#!/usr/bin/env bash
set -euo pipefail

README="$1"
VERSION="$2"

MARKER_START="<!-- SKYFLOW-BETA-DISCLAIMER:START -->"
MARKER_END="<!-- SKYFLOW-BETA-DISCLAIMER:END -->"

TEMP_FILE=$(mktemp)

# Check if version is beta (matches -beta.N pattern)
if [[ "$VERSION" =~ -beta\.[0-9]+ ]]; then
    # Remove existing banner if present
    if grep -q -F "$MARKER_START" "$README"; then
        sed "/$MARKER_START/,/$MARKER_END/d" "$README" > "$TEMP_FILE"
    else
        cp "$README" "$TEMP_FILE"
    fi

    # Insert banner after the first line (title)
    awk "NR==1 {print; print \"$MARKER_START\"; print \"> ⚠️ **Beta release — not for production use.** This is a pre-release build provided for early testing and feedback. It has not completed Skyflow's General Availability (GA) validation, its API may change before the stable release, and it is not covered by production SLAs or support commitments. Do not deploy beta builds to production environments.\"; print \"$MARKER_END\"; next} 1" "$TEMP_FILE" > "$README"
else
    # Remove banner if present
    if grep -q -F "$MARKER_START" "$README"; then
        sed "/$MARKER_START/,/$MARKER_END/d" "$README" > "$TEMP_FILE"
        mv "$TEMP_FILE" "$README"
    fi
fi

rm -f "$TEMP_FILE"
