# App under test (not committed)

The `2FAS Pass.app` simulator build is **gitignored** (~207 MB). Build it from source here:

```bash
# 1) clone the open-source iOS app
git clone --depth 1 https://github.com/twofas/2fas-pass-ios.git /tmp/2fas-pass-ios

# 2) one-time: install the Metal Toolchain (a dependency ships .metal shaders)
xcodebuild -downloadComponent MetalToolchain

# 3) build for the simulator WITH ad-hoc signing — required so the App Group
#    entitlement is embedded (without it the app crashes at CoreDataStack.swift:283
#    on a nil App Group container).
xcodebuild -project /tmp/2fas-pass-ios/2PASS/2PASS.xcodeproj -scheme 2PASS \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/2pass-dd \
  CODE_SIGN_IDENTITY="-" CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM="" PROVISIONING_PROFILE_SPECIFIER="" \
  build

# 4) copy the product here
cp -R "/tmp/2pass-dd/Build/Products/Debug-iphonesimulator/2FAS Pass.app" tests/e2e/ios/app/
```

Built from the open-source repo (release line 1.7.0). Bundle id `com.twofas.org.TwoPASS.dev`.
Override the path with `APP=/path/to/App.app ./e2e.sh` (see `../config.env`).
