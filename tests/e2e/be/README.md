# BE test utilities & misc BE tests

Browser-extension-only test helpers that aren't part of the autofill harness.

- `mockTabs.js` — predefined mock tab scenarios (`standard`, `loginForm`, `cardForm`, `internal`,
  `noInputs`, `localhost`) + `createMockTab()` for the popup's DEV tab-override E2E seam
  (`getLastActiveTab()` reads `popup.html?tab=mock` / `?tab=<id>` in DEV builds).
- `testContext.js` — programmatic helpers for unit/integration tests that drive the popup with a
  fixed tab context: `initTestContext(scenario)`, `initTestContextWithTabId(id)`,
  `initTestContextWithMockTab(tab)`, `resetTestContext()`.

```javascript
import { initTestContext, resetTestContext } from '@/tests/e2e/be/testContext';

beforeEach(() => initTestContext('loginForm'));
afterEach(() => resetTestContext());
```

All of this is DEV-only (gated by `import.meta.env.DEV`) and stripped from production builds.
