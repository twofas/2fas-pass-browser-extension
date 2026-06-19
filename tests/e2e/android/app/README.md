# APK under test (not committed)

The 2FAS Pass Android APK is **gitignored** (47 MB binary) — download it here before running:

```bash
gh release download 1.8.0 \
  --repo twofas/2fas-pass-android \
  --pattern app-release.apk \
  --output tests/e2e/android/app/twofas-pass-1.8.0.apk
```

Official signed release 1.8.0 · `com.twofasapp.pass` · sha256
`eb9f8fa6bee8e2b46893fd6614a576444fd822cf9935a077a3bbbc016b89d922`.

Override the path with `APK=/path/to.apk ./e2e.sh` (see `../config.env`).
