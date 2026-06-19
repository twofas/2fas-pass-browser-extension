#!/usr/bin/env bash
# Add the Login item (John / Doe / google.com / Secret) to an already-onboarded vault.
# Boots the emulator if none is connected; self-unlocks if the app is locked.
#   ./add-login.sh
#   ./add-login.sh --format junit --output artifacts/report_add_login.xml
set -euo pipefail
E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$E2E_DIR/run.sh" "$E2E_DIR/flows/add-login.yaml" "$@"
