# 2FAS Pass — iOS E2E (Maestro)

End-to-end UI tests that drive the **2FAS Pass iOS app** (dev build, `com.twofas.org.TwoPASS.dev`)
on a real **iOS Simulator** with [Maestro](https://maestro.mobile.dev/). This is the iOS mirror of
`tests/e2e/android/` — same structure, same scenarios (onboarding → add-login), one shared YAML DSL.

The harness is built for **reuse**: the device plumbing, the onboarding flow, the unlock step, and
item creation are each independent, composable pieces. New scenarios reuse them instead of
re-implementing UI navigation.

> All paths below are relative to `tests/e2e/ios/`. This folder is gitignored (so the ~30 MB `.app`
> and run artifacts are not committed).

## Layout

```
tests/e2e/ios/
├── config.env                      # shared config (APP_ID, DEVICE_*, APP, MASTER_PASSWORD) — env-overridable
├── app/
│   └── 2FAS Pass.app               # the ad-hoc-signed dev .app under test (iphonesimulator build)
├── lib/
│   └── device.sh                   # ⟲ reusable shell lib: ios_ensure_booted / ios_ensure_installed / ios_run_flow
├── flows/
│   ├── onboarding.yaml             # ⟲ ENTRY + reusable: fresh launch (clearState) → created & encrypted vault
│   ├── add-login.yaml              # ENTRY: launch → unlock-if-locked → create-login → verify detail
│   └── shared/
│       ├── unlock-if-locked.yaml   # ⟲ reusable subflow: unlock IF the Master-Password lock screen shows
│       └── create-login.yaml       # ⟲ reusable subflow: create ANY Login (parameterized by env)
├── run.sh                          # generic runner: boot(if needed)+install(if needed)+run <flow>
├── onboarding.sh                   # thin wrapper → run.sh flows/onboarding.yaml
├── add-login.sh                    # thin wrapper → run.sh flows/add-login.yaml
├── e2e.sh                          # full pipeline: onboarding, then add-login
└── artifacts/                      # screenshots, JUnit reports (created on run)
```

`⟲` = a reusable building block meant to be composed by future flows/scenarios.

## Build the app

The bundled `app/2FAS Pass.app` was built ad-hoc-signed for the simulator. To rebuild from source:

```bash
xcodebuild -project /tmp/2fas-pass-ios/2PASS/2PASS.xcodeproj \
  -scheme 2PASS -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/2pass-dd \
  CODE_SIGN_IDENTITY="-" CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM="" \
  PROVISIONING_PROFILE_SPECIFIER="" build
# then copy the product into app/:
cp -R /tmp/2pass-dd/Build/Products/Debug-iphonesimulator/"2FAS Pass.app" "tests/e2e/ios/app/"
```

> **Ad-hoc signing (`CODE_SIGN_IDENTITY="-"`) is REQUIRED** so the App Group entitlement is embedded.
> Without it the app crashes at `CoreDataStack.swift:283` on a nil App Group container.

## Run

```bash
# Full pipeline (boots the sim if it is not running): onboarding → add the Login item.
./tests/e2e/ios/e2e.sh

# Just onboarding (to a created vault):
./tests/e2e/ios/onboarding.sh

# Just add-login (on an already-onboarded vault; self-unlocks if locked):
./tests/e2e/ios/add-login.sh

# Any flow, with extra Maestro args forwarded (JUnit, output dir, …):
./tests/e2e/ios/run.sh flows/onboarding.yaml --format junit --output artifacts/report.xml

# Pick a different device / runtime:
DEVICE_TYPE="iPhone 17" IOS_RUNTIME="com.apple.CoreSimulator.SimRuntime.iOS-26-5" ./tests/e2e/ios/e2e.sh
```

The runner leaves the simulator booted for fast re-runs. Tear it down with
`xcrun simctl shutdown <udid>` (find it with `xcrun simctl list devices | grep Booted`).

> The **first** Maestro run against a simulator builds a one-time XCTest driver (slow, minutes);
> subsequent runs are fast. Treat that first build as setup, not a hang.

## Reuse / extend

**Create a different Login** — pass different `env` to the `create-login` subflow. From a new flow:

```yaml
appId: com.twofas.org.TwoPASS.dev
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

**Reuse onboarding** from another flow: `- runFlow: ../onboarding.yaml` (override the master password
with `env: { MASTER_PASSWORD: "…" }`).

**Reuse the device plumbing** in a new scenario script:

```bash
E2E_DIR="tests/e2e/ios"; source "$E2E_DIR/config.env"; source "$E2E_DIR/lib/device.sh"
ios_ensure_booted                       # sets $UDID
ios_ensure_installed "$APP" "$APP_ID"
cd "$E2E_DIR"; ios_run_flow "flows/my-new-flow.yaml" --format junit --output artifacts/my.xml
```

### Config / parameters

| Where | Key | Default | Notes |
|-------|-----|---------|-------|
| `config.env` | `APP_ID` | `com.twofas.org.TwoPASS.dev` | bundle id under test |
| `config.env` | `DEVICE_NAME` | `2FAS-E2E` | the simulator's name (find-or-create) |
| `config.env` | `DEVICE_TYPE` | `iPhone 16` | any installed device type |
| `config.env` | `IOS_RUNTIME` | `…SimRuntime.iOS-26-4` | any installed runtime |
| `config.env` | `APP` | `app/2FAS Pass.app` | the .app to install |
| `config.env` | `MASTER_PASSWORD` | `testtesttest` | vault master password (app rule: ≥ 9 chars) |
| `flows/onboarding.yaml` (env) | `MASTER_PASSWORD` | `testtesttest` | password set during onboarding |
| `flows/shared/unlock-if-locked.yaml` (env) | `MASTER_PASSWORD` | `testtesttest` | password used to unlock |
| `flows/shared/create-login.yaml` (env) | `NAME`/`USERNAME`/`PASSWORD`/`URI`/`TIER` | `google.com`/`John`/`Doe`/`google.com`/`Secret` | the item to create |

## Discovered onboarding screen sequence (grounded live on iPhone 16 / iOS 26.4)

| # | Screen | Stable selector(s) | Action |
|---|--------|--------------------|--------|
| 1 | Intro carousel (page 1/3) | `Local-first Password Manager`, `Get Started` | tap **Get Started** |
| 2 | Vault Encryption Setup | `2FAS Pass Vault`, `Vault Encryption Setup` | tap **Continue** |
| 3 | Generate Secret Words | `Generate Secret Words`, `Tap and hold` | **press-and-hold** (swipe start==end, 4 s); top up until `Secret Words Generated!` |
| 4 | Secret Words Generated! | `Secret Words Generated!` | tap **Continue** |
| 5 | You are halfway there | `You are halfway there` | tap **Create Master Password** |
| 6 | Create Master Password | `Create Master Password`, Password field @ pt `61%,33%` | type password → **Continue** (reveals confirm) |
| 6b | …confirm | `Confirm password` field @ pt `61%,39%` | type password → **Continue** |
| 7 | Vault Decryption Kit | `Vault Decryption Kit`, "I understand" switch @ pt `85%,80%`, `Save PDF file` | flip switch ON → **Save PDF file** |
| 8 | iOS share sheet | `id: header.closeButton`, `Save to Files` | tap **Save to Files** |
| 8b | Files picker ("On My iPhone") | *(empty a11y tree)* — blue **Save** @ pt `87%,13%` | tap **Save** → app advances |
| 9 | Setup complete! | `Setup complete!`, `Start using 2FAS Pass` | tap **Start using 2FAS Pass** |
| 10 | Quick setup (upsell sheet) | `Quick setup`, `Close` | tap **Close** |
| 11 | HOME / VAULT | `No Items available`, `Connect`, `Settings` | (onboarding complete) |

## Discovered add-login screen sequence

| # | Screen | Stable selector(s) | Action |
|---|--------|--------------------|--------|
| 0 | (lock screen, if locked) | `Master Password`, field @ pt `51%,39%`, `Unlock` | type `testtesttest` → **Unlock** |
| 1 | HOME | `add` (the `+` top-right) | tap **+** |
| 2 | Add-item popup | `Login` / `Card` / `Secure Note` | tap **Login** |
| 3 | Add Login form | `Add Login, Actions Menu`; Name @ pt `61%,34%`, Username @ pt `61%,40%`, Password @ pt `61%,46%` | fill Name, Username; **erase + type** Password (pre-filled) |
| 4 | (scroll up) | swipe `50%,40%`→`50%,20%` to clear the keyboard from the lower rows | — |
| 5 | Security Tier cell | `Security Tier, Secret` | open **Choose Security Tier** |
| 5b | Choose Security Tier | `Choose Security Tier`; options `Secret` / `Highly Secret` / `Top Secret` | tap **^Secret$** (returns, keyboard down) |
| 6 | Website URL | `+  Add URL` @ pt `50%,42%`, then `URL` field @ pt `50%,42%` | tap Add URL → type `google.com` |
| 7 | Save | `Done` (top-right check) | tap **Done** |
| 8 | Items list | `google.com, John` | open the item |
| 9 | Item Details | `google.com`, `Username, John`, `URL`, `^Security Tier, Secret$` | verify round-trip |

## iOS-specific gotchas (grounded in real runs — this is the load-bearing part)

- **`testtesttest` is accepted** as the master password (the only rule is ≥ 9 characters). The iOS
  Create-Master-Password screen is a **single screen that reveals the "Confirm password" field only
  after** the first password is typed and **Continue** is tapped — there are NOT two fields up front.

- **Screenshots are real evidence.** Unlike Android (FLAG_SECURE blanks in-app frames), the iOS
  Simulator renders every frame fully — the 14 PNGs in `artifacts/` are genuine per-screen evidence.

- **Tap text fields by POINT, not by label.** Every form field's `accessibilityText` is on the LABEL,
  while the editable area is to its right. `tapOn: "Name"` hits the label and does NOT focus the field;
  tapping the input area by point (e.g. `61%,34%`) does.

- **The Password field is pre-filled** with a generated value. `eraseText: 50` clears it cleanly on
  iOS (no Android-#1777 trailing-suffix bug), then `inputText` writes the exact value.

- **Decryption-Kit gate = a real system share sheet + Files picker.** The kit must be PERSISTED for
  the app to advance — closing the share sheet does nothing. We go **Save PDF file → share sheet
  ("Save to Files") → Files picker → blue Save**. Two non-obvious traps:
  - The **Files picker has a completely empty accessibility tree** (it is a separate system process),
    so its blue **Save** button can only be tapped by point. **`87%,13%` hits it; `87%,12%` misses**
    (lands 1 % above the button) and silently leaves the picker up.
  - The share-sheet → picker → export → advance chain is **timing-flaky** on the Simulator, so
    `onboarding.yaml` drives it with a **resilient `repeat`-until-`Setup complete!` state machine**
    (re-open the share sheet if we fall back to the kit; tap "Save to Files" if the share sheet is up;
    otherwise tap Save by point) rather than a brittle fixed sequence.
  - **Do NOT manually delete the saved kit PDFs** from the simulator's File Provider Storage — doing
    so corrupts the Files index and produces a *"you don't have permission to view it"* dialog. Let
    the app save with its unique-timestamp filenames; no cleanup is needed.

- **"Save Password?" keychain prompt.** The iOS QuickType keyboard raises a system *Save Password?*
  prompt when a password field loses focus. It appears at unpredictable moments and OVERLAYS the app,
  so `create-login.yaml` defensively dismisses it (`Not Now`) right before every screen it asserts on.

- **Sticky keyboard.** `hideKeyboard` is unreliable in this SwiftUI form (Maestro 2.6.0). To surface
  the rows below the fold we **scroll** the form (a swipe). Selecting a Security Tier conveniently
  returns to the form with the keyboard already down, so we set the tier BEFORE adding the URL.

- **`+  Add URL` has two spaces** in its label, which breaks Maestro text matching — it is tapped by
  point. The URL field appears only after that row is tapped.

- **Item-detail URL has zero-width spaces** between characters (`g​o​o​g​l​e​.​c​o​m`), so the
  verification asserts the stable label rows (`URL`, `Username, John`, `^Security Tier, Secret$`)
  instead of a literal `google.com` URL match.

- **Locale.** The simulators on this machine default to **Polish** when reset. `2FAS-E2E` is pinned to
  **English** (its `.GlobalPreferences.plist` has `AppleLanguages=[en-US]`, `AppleLocale=en_US`). If
  you ever `simctl erase` it, the locale reverts to Polish and the English selectors break — re-pin
  English before running, or re-ground the selectors. (No erase happens in normal runs.)

- **No Face ID / camera.** The flows never hit biometrics — master-password unlock is used. QR pairing
  (Connect) is out of scope here: the Simulator has no camera. Onboarding + add-login only.

## Last verified

Full `./e2e.sh` on `2FAS-E2E` (iPhone 16, iOS 26.4, English) — onboarding **SUCCESS** (74 s),
add-login **SUCCESS** (63 s). JUnit in `artifacts/report_onboarding.xml` +
`artifacts/report_add_login.xml`; 14 screenshots in `artifacts/`. The `John` / `google.com` /
`Secret` Login round-trips on the detail screen and persists across an app relaunch + master-password
unlock.

## Connect + Autofill — NOT possible on the iOS Simulator

The Android harness has a third part — pair the browser extension via the Connect **QR** and run
autofill. **That cannot run on the iOS Simulator**, and it's a harder wall than Android:

- The **iOS Simulator has no camera at all** (`AVCaptureDevice.default(for: .video)` is nil). There is
  no equivalent of Android's `-virtualscene-poster` / camera injection — the simulator simply has no
  camera feed to drive.
- 2FAS Pass iOS **Connect is camera-only**: verified in source — no manual code entry, no
  photo-library/import, no pasteboard path, and the `twofaspass://` URL scheme only handles backup
  files (`RootPresenter.applicationOpenURL` → `isBackupFileURL`), not pairing. So there is no
  non-camera channel to feed the QR either.

Net: pairing cannot be automated **or** done manually on the iOS Simulator (you can't scan with a
device that has no camera). The connect+autofill flow needs a **physical iPhone** (real camera scans
the extension's QR) — the browser-extension side (`tests/e2e/connect-autofill/`) is unchanged; only
the mobile peer differs. Onboarding + add-login (above) are the parts that ARE fully automatable on
the simulator, and they are.
