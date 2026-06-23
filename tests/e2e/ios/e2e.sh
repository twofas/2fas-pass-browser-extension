#!/usr/bin/env bash
# Full pipeline: boot (if needed) + onboarding, THEN add the Login item.
# Each step is a separate Maestro run reusing the same booted simulator.
#   ./e2e.sh
#   DEVICE_TYPE="iPhone 17" ./e2e.sh
set -euo pipefail
E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "### 1/2 — onboarding (creates the vault) ###"
"$E2E_DIR/onboarding.sh" --format junit --output "$E2E_DIR/artifacts/report_onboarding.xml"

echo
echo "### 2/2 — add Login item (John / Doe / google.com / Secret) ###"
"$E2E_DIR/add-login.sh" --format junit --output "$E2E_DIR/artifacts/report_add_login.xml"

echo
echo "### Pipeline complete: vault onboarded + Login item created. ###"
