#!/usr/bin/env bash
#
# Combined Android + Autofill E2E (semi-automated) — the maximum automation achievable
# on an Apple-Silicon Mac, where the emulator camera cannot scan a QR (see README.md).
#
# Phase 1 (auto): boot emulator + onboard + create a Secret-tier Login (John/Doe/google.com).
# Phase 2 (auto): build the dev extension (with the autofill DEV seam).
# Phase 3 (auto, except ONE scan): launch Chromium+extension, open + display the Connect QR,
#         wait for you to scan it once, then run the FULL autofill suite and print PASS/FAIL.
#
# Usage:
#   ./tests/e2e/connect-autofill/run.sh
#   SKIP_ANDROID=1 ./tests/e2e/connect-autofill/run.sh   # reuse an already-onboarded emulator
#   SKIP_BUILD=1   ./tests/e2e/connect-autofill/run.sh   # reuse an existing .output/chrome-mv3-dev
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SKIP_ANDROID="${SKIP_ANDROID:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"

if [ "$SKIP_ANDROID" != "1" ]; then
  echo "### Phase 1/3 — Android: boot emulator + onboard + create Secret-tier Login ###"
  ./tests/e2e/android/e2e.sh
else
  echo "### Phase 1/3 — skipped (SKIP_ANDROID=1) ###"
fi

echo
if [ "$SKIP_BUILD" != "1" ]; then
  echo "### Phase 2/3 — build dev extension (.output/chrome-mv3-dev, includes the autofill seam) ###"
  yarn build:dev
else
  echo "### Phase 2/3 — skipped (SKIP_BUILD=1) ###"
fi

echo
echo "### Phase 3/3 — connect (scan QR once) + run ALL autofill tests ###"
node tests/e2e/connect-autofill/runConnectAutofill.mjs
