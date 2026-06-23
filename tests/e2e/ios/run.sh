#!/usr/bin/env bash
#
# Generic runner: boot the simulator (if not already booted) + install the .app (if missing)
# + run a Maestro flow on it. Reused by every scenario script.
#
#   ./run.sh flows/onboarding.yaml
#   ./run.sh flows/add-login.yaml --format junit --output artifacts/report.xml
#   DEVICE_TYPE="iPhone 17" ./run.sh flows/onboarding.yaml
set -euo pipefail
E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$E2E_DIR/config.env"
# shellcheck source=/dev/null
source "$E2E_DIR/lib/device.sh"

FLOW="${1:?usage: run.sh <flow.yaml> [extra maestro args...]}"; shift || true
[ -f "$FLOW" ] || FLOW="$E2E_DIR/$FLOW"   # allow paths relative to the e2e/ dir

ios_ensure_booted                 # sets $UDID for the target simulator
ios_ensure_installed "$APP" "$APP_ID"

# Run maestro from the e2e dir so flow `takeScreenshot: artifacts/...` paths (which Maestro
# resolves relative to the CWD) always land in tests/e2e/ios/artifacts/.
cd "$E2E_DIR"
ios_run_flow "$FLOW" "$@"
