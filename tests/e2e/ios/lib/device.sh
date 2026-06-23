# Reusable iOS Simulator helpers for the 2FAS Pass E2E harness.
# SOURCE this file (do not execute). Exposes: ios_ensure_booted, ios_ensure_installed,
# ios_run_flow. Sets $UDID for the target simulator.

: "${DEVICE_NAME:=2FAS-E2E}"
: "${DEVICE_TYPE:=iPhone 16}"
: "${IOS_RUNTIME:=com.apple.CoreSimulator.SimRuntime.iOS-26-4}"

_ios_udid_for_name() {
  # First UDID on a line that names our device.
  xcrun simctl list devices | grep -E "^[[:space:]]*${DEVICE_NAME} \(" | head -1 | grep -ioE '[0-9A-F-]{36}' | head -1
}

_ios_state() {  # $1 = udid
  xcrun simctl list devices | grep -i "$1" | grep -oE '\((Booted|Booting|Shutdown|Shutting Down)\)' | tr -d '()' | head -1
}

# ios_ensure_booted — find-or-create the sim of name $DEVICE_NAME, boot it, wait until ready.
ios_ensure_booted() {
  UDID="$(_ios_udid_for_name)"
  if [ -z "$UDID" ]; then
    echo "Creating simulator '$DEVICE_NAME' ($DEVICE_TYPE, $IOS_RUNTIME) ..."
    UDID="$(xcrun simctl create "$DEVICE_NAME" "$DEVICE_TYPE" "$IOS_RUNTIME")"
  fi

  local state; state="$(_ios_state "$UDID")"
  if [ "$state" = "Booted" ]; then
    echo "✓ Simulator already booted: $UDID"
  else
    echo "Booting $UDID ..."
    open -a Simulator >/dev/null 2>&1 || true   # the UI app, so previews/screens render
    xcrun simctl boot "$UDID" 2>/dev/null || true
    xcrun simctl bootstatus "$UDID" -b           # block until fully booted
    echo "✓ Simulator ready: $UDID"
  fi
}

# ios_ensure_installed <app-path> <bundle-id>
ios_ensure_installed() {
  if xcrun simctl get_app_container "$UDID" "$2" >/dev/null 2>&1; then
    echo "✓ $2 already installed."
  else
    echo "Installing $1 ..."
    xcrun simctl install "$UDID" "$1"
  fi
}

# ios_run_flow <flow.yaml> [extra maestro args...] — run on the target sim, one retry.
ios_run_flow() {
  local flow="$1"; shift
  local attempt=1 max=2
  while true; do
    if maestro --device "$UDID" test "$@" "$flow"; then return 0; fi
    if [ "$attempt" -ge "$max" ]; then echo "✗ Flow failed after ${attempt} attempt(s)." >&2; return 1; fi
    echo "Flow failed — retrying (attempt $((attempt + 1))/${max}) after settle ..." >&2
    attempt=$((attempt + 1)); sleep 5
  done
}
