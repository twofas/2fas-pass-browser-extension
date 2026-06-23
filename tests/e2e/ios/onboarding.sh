#!/usr/bin/env bash
# Boot (if needed) + install (if needed) + run onboarding to a created vault.
#   ./onboarding.sh                     # plain run
#   ./onboarding.sh --format junit --output artifacts/report_onboarding.xml
set -euo pipefail
E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$E2E_DIR/run.sh" "$E2E_DIR/flows/onboarding.yaml" "$@"
