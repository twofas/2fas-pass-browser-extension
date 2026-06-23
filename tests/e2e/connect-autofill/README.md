# Connect + Autofill E2E (combined, semi-automated)

Runs the **whole** flow end to end: boot an Android emulator → onboard 2FAS Pass + create a
Secret-tier Login → build the dev extension → launch Chromium with it → pair via the **Connect
QR** → run the **full autofill suite** against the live pairing.

Everything is automated **except one step**: scanning the QR. See **Why semi-automated** below.

```bash
./tests/e2e/connect-autofill/run.sh
```

## Phases

| Phase | What | Automated? |
|------|------|-----------|
| 1 | `tests/e2e/android/e2e.sh` — boot emulator, onboard (master pw `testtesttest`), add Login `John`/`Doe`/`google.com` (Secret tier) | ✅ |
| 2 | `yarn build:dev` → `.output/chrome-mv3-dev` (the build that carries the DEV autofill seam) | ✅ |
| 3 | `runConnectAutofill.mjs` — launch extension, **show the Connect QR**, wait for the scan, then run **all** autofill targets and print PASS/FAIL | ✅ except the scan |

```bash
SKIP_ANDROID=1 ./tests/e2e/connect-autofill/run.sh   # reuse an already-onboarded emulator
SKIP_BUILD=1   ./tests/e2e/connect-autofill/run.sh   # reuse an existing .output/chrome-mv3-dev
```

## The one manual step (and the device caveat)

When Phase 3 prints **ACTION NEEDED**, a QR window opens (`/tmp/2fas_connect_qr.png`, also shown
in the Chromium popup tab). **Scan it with a 2FAS Pass app whose vault has a Secret-tier Login
with BOTH a username and a password**, then the run continues on its own.

⚠️ **Scan with a physical phone, not the emulator.** The autofill harness fills from *the vault of
whatever device pairs*. Phase 1's emulator has the right login (`John`/`Doe`), but the **emulator
camera cannot scan a QR on Apple Silicon** (see below), so it can't be the peer here. Use a real
phone that has such a Login (or onboard one the same way).

## Why semi-automated (the camera wall)

Pairing is **camera-only** (no manual entry, no connect deep-link — the manifest has only
`twofaspass://share`). On this **Apple-Silicon** Mac, the emulator cannot present a scannable QR to
its camera. Exhaustively tested and confirmed:

- `-virtualscene-poster` / `adb emu virtualscene-image` (boot + runtime), with a real qrData → scanner never reads it.
- The virtual-scene camera renders a **static low-res green "fake scene"** that ignores pose changes (`rotateVirtualSceneCamera`, `setVirtualSceneCameraVelocity`, `setPhysicalModel` POSITION/ROTATION via gRPC) — a known arm64/Apple-Silicon limitation ([google/android-emulator-m1-preview#62](https://github.com/google/android-emulator-m1-preview/issues/62)).
- `-camera-back imagefile:<png>` → **same green fallback** (host-rendered camera modes don't work on arm64 here).
- No gRPC camera-frame injection exists; `videoplayback` is off + has no scriptable source; the only host webcam is the real FaceTime camera.
- The battle-tested fix — an **x86_64 image** + virtualscene — **cannot run on Apple Silicon** (arm64 host, HVF needs arm64 guests).

**Where it runs fully automated:** an **Intel macOS / Linux CI** with an **x86_64** emulator, using
`adb emu virtualscene-image wall qr.png` before opening the scanner; or a cloud device farm with
camera image injection (BrowserStack / Sauce Labs / LambdaTest). The pieces here (qrData extraction,
QR render, the autofill `runTargets`) port directly to those environments.

## Files

- `run.sh` — the 3-phase orchestrator.
- `runConnectAutofill.mjs` — Phase 3: launch + show QR + wait for scan + run all autofill targets (reuses `tests/e2e/autofill`'s exported `runTargets` — no logic duplication; `runAutofillE2E.js` was made import-safe via an entry-point guard).
- `probeQr.mjs` — standalone: prove live `qrData` extraction from the extension (`wsConnectQr` → base64 `scheme:sessionId:keys:sig`).
- `renderQr.mjs` — render a qrData string to a QR PNG.
- `sceneNav.py` — emulator gRPC client (token auth from the discovery .ini): getStatus / pose get-set / virtual-scene camera nav. Used during the camera investigation; kept for the x86_64/CI path.

## Prereqs

`adb`, `emulator`, `maestro`, Node + yarn deps, Playwright Chromium (`npx playwright install chromium`).
The APK + Maestro flows come from `tests/e2e/android/`. `VITE_WSS_URL_ORIGIN` must be `pass.2fas.com`
(the prod relay) so the dev extension and a prod mobile app meet on the same relay — this is the
default in `.env.development`.
