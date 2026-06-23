# Reusable Android device helpers for the 2FAS Pass E2E harness.
# SOURCE this file (do not execute it). Requires ANDROID_HOME (falls back to the
# standard macOS SDK location). Exposes: e2e_ensure_booted, e2e_ensure_installed,
# e2e_run_flow.

: "${ANDROID_HOME:=$HOME/Library/Android/sdk}"
ADB="$ANDROID_HOME/platform-tools/adb"
EMULATOR="$ANDROID_HOME/emulator/emulator"

# e2e_ensure_booted <avd-name>
# Boots the AVD only if no device is connected, then blocks until the system is
# fully interactive (boot_completed + bootanim stopped + launcher focused + settle).
e2e_ensure_booted() {
  local avd="$1" booted=0
  if "$ADB" devices | awk 'NR>1 && $2=="device"{f=1} END{exit !f}'; then
    echo "✓ Device already connected — reusing it."
  else
    booted=1
    echo "No device connected — booting AVD '$avd' ..."
    if ! "$EMULATOR" -list-avds | grep -qx "$avd"; then
      echo "✗ AVD '$avd' not found. Available AVDs:" >&2
      "$EMULATOR" -list-avds >&2
      return 1
    fi
    nohup "$EMULATOR" -avd "$avd" -no-snapshot -no-boot-anim -gpu auto \
      > "/tmp/e2e_emu_${avd}.log" 2>&1 &
    echo "  emulator started (pid $!, log: /tmp/e2e_emu_${avd}.log)"
  fi

  echo "Waiting for device ..."
  "$ADB" wait-for-device

  # A warm, already-connected device is interactive — skip the boot/launcher gate
  # (the app, not the launcher, may be foregrounded, which would stall the gate).
  if [ "$booted" -eq 0 ]; then
    echo "✓ Device ready (reused): $("$ADB" get-serialno)"
    return 0
  fi

  echo "Waiting for boot to complete ..."
  local t=0
  until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    t=$((t + 1)); if [ "$t" -gt 180 ]; then echo "✗ Boot timed out (~6 min)." >&2; return 1; fi
    sleep 2
  done
  until [ "$("$ADB" shell getprop init.svc.bootanim 2>/dev/null | tr -d '\r')" = "stopped" ]; do sleep 2; done
  "$ADB" shell input keyevent 82 >/dev/null 2>&1 || true   # dismiss lock screen if shown
  # boot_completed fires before the system can launch apps — wait for launcher focus.
  echo "Waiting for system to become interactive ..."
  t=0
  until "$ADB" shell dumpsys window 2>/dev/null | grep -qiE 'mCurrentFocus=.*launcher'; do
    t=$((t + 1)); if [ "$t" -gt 90 ]; then echo "  (launcher focus not detected — continuing)"; break; fi
    sleep 2
  done
  sleep 3
  echo "✓ Device ready: $("$ADB" get-serialno)"
}

# e2e_ensure_installed <apk-path> <package>
e2e_ensure_installed() {
  if "$ADB" shell pm path "$2" >/dev/null 2>&1; then
    echo "✓ $2 already installed."
  else
    echo "Installing $1 ..."
    "$ADB" install -r -g "$1"
  fi
}

# e2e_run_flow <flow.yaml> [extra maestro args...]
# Runs the flow with a one-shot retry to absorb the post-boot launch race.
e2e_run_flow() {
  local flow="$1"; shift
  local attempt=1 max=2
  while true; do
    if maestro test "$@" "$flow"; then return 0; fi
    if [ "$attempt" -ge "$max" ]; then echo "✗ Flow failed after ${attempt} attempt(s)." >&2; return 1; fi
    echo "Flow failed — retrying (attempt $((attempt + 1))/${max}) after settle ..." >&2
    attempt=$((attempt + 1)); sleep 5
  done
}
