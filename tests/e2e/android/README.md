# 2FAS Pass — Android E2E (Maestro)

End-to-end UI tests that drive the **official signed 2FAS Pass Android app** (release 1.8.0,
`com.twofasapp.pass`) on a real Android emulator with [Maestro](https://maestro.mobile.dev/).

The harness is built for **reuse**: the device plumbing, the onboarding flow, the unlock step,
and item creation are each independent, composable pieces. New scenarios reuse them instead of
re-implementing UI navigation.

> All paths below are relative to `tests/e2e/android/`. This folder is gitignored (so the 47 MB APK
> and run artifacts are not committed).

## Layout

```
tests/e2e/android/
├── config.env                      # shared config (APP_ID, AVD, APK, MASTER_PASSWORD) — env-overridable
├── app/
│   └── twofas-pass-1.8.0.apk       # the official signed APK under test (sha256 eb9f8fa6…)
├── lib/
│   └── device.sh                   # ⟲ reusable shell lib: ensure_booted / ensure_installed / run_flow
├── flows/
│   ├── onboarding.yaml             # ⟲ ENTRY + reusable: fresh install → created & encrypted vault
│   ├── add-login.yaml              # ENTRY: launch → unlock-if-locked → create-login → verify detail
│   └── shared/
│       ├── unlock-if-locked.yaml   # ⟲ reusable subflow: unlock IF locked (self-guarding)
│       └── create-login.yaml       # ⟲ reusable subflow: create ANY Login (parameterized by env)
├── run.sh                          # generic runner: boot(if needed)+install(if needed)+run <flow>
├── onboarding.sh                   # thin wrapper → run.sh flows/onboarding.yaml
├── add-login.sh                    # thin wrapper → run.sh flows/add-login.yaml
├── e2e.sh                          # full pipeline: onboarding, then add-login
└── artifacts/                      # screenshots, JUnit reports (created on run)
```

`⟲` = a reusable building block meant to be composed by future flows/scenarios.

## Run

```bash
# Full pipeline (boots the emulator if none is connected): onboarding → add the Login item.
./tests/e2e/android/e2e.sh

# Just onboarding (to a created vault):
./tests/e2e/android/onboarding.sh

# Just add-login (on an already-onboarded vault; self-unlocks if locked):
./tests/e2e/android/add-login.sh

# Any flow, with extra Maestro args forwarded (JUnit, output dir, …):
./tests/e2e/android/run.sh flows/onboarding.yaml --format junit --output artifacts/report.xml

# Pick a different device (any installed arm64 AVD ≥ API 31):
AVD=Pixel_9_API_36 ./tests/e2e/android/e2e.sh
```

The runner leaves the emulator booted for fast re-runs. Tear it down with
`adb -s emulator-5554 emu kill`.

## Reuse / extend

**Create a different Login** — pass different `env` to the `create-login` subflow. From a new
flow:

```yaml
appId: com.twofasapp.pass
---
- launchApp
- runFlow: shared/unlock-if-locked.yaml
- runFlow:
    file: shared/create-login.yaml
    env:
      NAME: "GitHub"
      USERNAME: "octocat"
      PASSWORD: "hunter2hunter2"
      URI: "github.com"
      TIER: "Highly Secret"
```

**Reuse onboarding** from another flow: `- runFlow: ../onboarding.yaml` (override the master
password with `env: { MASTER_PASSWORD: "…" }`).

**Reuse the device plumbing** in a new scenario script:

```bash
E2E_DIR="tests/e2e/android"; source "$E2E_DIR/config.env"; source "$E2E_DIR/lib/device.sh"
e2e_ensure_booted "$AVD"
e2e_ensure_installed "$APK" "$APP_ID"
cd "$E2E_DIR"; e2e_run_flow "flows/my-new-flow.yaml" --format junit --output artifacts/my.xml
```

### Config / parameters

| Where | Key | Default | Notes |
|-------|-----|---------|-------|
| `config.env` | `APP_ID` | `com.twofasapp.pass` | package under test |
| `config.env` | `AVD` | `Pixel_8_API_34` | any installed arm64 AVD ≥ API 31 |
| `config.env` | `APK` | `app/twofas-pass-1.8.0.apk` | the APK to install |
| `config.env` | `MASTER_PASSWORD` | `testtesttest` | vault master password (app rule: ≥ 9 chars) |
| `flows/onboarding.yaml` (env) | `MASTER_PASSWORD` | `testtesttest` | password set during onboarding |
| `flows/shared/unlock-if-locked.yaml` (env) | `MASTER_PASSWORD` | `testtesttest` | password used to unlock |
| `flows/shared/create-login.yaml` (env) | `NAME`/`USERNAME`/`PASSWORD`/`URI`/`TIER` | `google.com`/`John`/`Doe`/`google.com`/`Secret` | the item to create |

## How it works / gotchas (grounded in real runs)

- **Boot gate + post-boot race.** `lib/device.sh` boots the AVD only if no device is connected,
  then waits for `sys.boot_completed` + `bootanim=stopped` + launcher focus. Even so, the *first*
  app launch after a cold boot can lose a race with the ActivityManager (`Unable to launch app`),
  so `e2e_run_flow` retries once. A warm/reused device skips the gate (the app, not the launcher,
  may be foregrounded — which would otherwise stall the launcher-focus wait).
- **`takeScreenshot` paths are CWD-relative**, while `runFlow: file:` paths are flow-file-relative.
  The runner `cd`s into `tests/e2e/android/` before invoking Maestro so `artifacts/…` screenshots land
  in `tests/e2e/android/artifacts/`, while subflows are referenced as `shared/…` from `flows/`.
- **FLAG_SECURE.** 2FAS Pass sets `FLAG_SECURE`, so in-app `takeScreenshot` frames are black/redacted
  (~7.6 KB) on this non-rootable image. That's expected — the assertions (and, during authoring, the
  `maestro hierarchy` dumps) are the authoritative per-screen evidence. System screens (SAF picker)
  and the pre-secure intro render normally.
- **Onboarding press-and-hold.** Maestro 2.6.0 can't sustain `longPressOn`; the secret-words ring is
  filled with a `swipe` whose `start == end` and `duration: 4000`, then topped up via a guarded
  `repeat` until "Secret Words Generated!".
- **Master password `testtesttest` is accepted** — the only onboarding rule is "At least 9 characters".
- **Add-Login specifics.** The add-item FAB is icon-only (tapped by point ≈ `89%,84%`). **Name is
  required** (Save is a no-op while empty) — the example sets it to the URI `google.com`. The password
  field is **pre-filled** with a generated value, overwritten via long-press → "Select all" → type
  (plain `eraseText` leaves a suffix — Maestro #1777). The URL field appears only after "+ Add URL".
  Security tier is chosen in the "Choose Security Tier" sheet (`Secret` / `Highly Secret` / `Top
  Secret`); the matcher is anchored `^Secret$` because a bare `Secret` substring-matches the others.

## Last verified

Full `./e2e.sh` from a cold boot on `Pixel_8_API_34` (Android 14) — onboarding **SUCCESS**, add-login
**SUCCESS** (JUnit in `artifacts/report_onboarding.xml` + `artifacts/report_add_login.xml`).
Independently confirmed the `John` / `google.com` / `Secret` Login persists across an app restart +
master-password unlock.
