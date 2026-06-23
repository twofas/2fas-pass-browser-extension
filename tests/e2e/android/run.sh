#!/usr/bin/env bash
#
# Generic runner: boot the emulator (if no device is connected) + install the APK
# (if missing) + run a Maestro flow. Reused by every scenario script.
#
#   ./run.sh flows/onboarding.yaml
#   ./run.sh flows/add-login.yaml --format junit --output artifacts/report.xml
#   AVD=Pixel_9_API_36 ./run.sh flows/onboarding.yaml
set -euo pipefail
E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$E2E_DIR/config.env"
# shellcheck source=/dev/null
source "$E2E_DIR/lib/device.sh"

FLOW="${1:?usage: run.sh <flow.yaml> [extra maestro args...]}"; shift || true
[ -f "$FLOW" ] || FLOW="$E2E_DIR/$FLOW"   # allow paths relative to the e2e/ dir

e2e_ensure_booted "$AVD"
e2e_ensure_installed "$APK" "$APP_ID"

# Run maestro from the e2e dir so flow `takeScreenshot: artifacts/...` paths (which
# Maestro resolves relative to the CWD) always land in tests/e2e/android/artifacts/.
cd "$E2E_DIR"
e2e_run_flow "$FLOW" "$@"
