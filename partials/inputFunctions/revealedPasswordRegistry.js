// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// All content scripts of the extension in a frame share one global scope (one isolated world per
// extension), so a set stored there is written by the always-loaded focus script and read by the
// on-demand autofill / prompt scripts. The page's own scripts cannot reach it.
const REGISTRY_KEY = '__twofasPassRevealedInputs';

/**
* Returns the frame-wide set of inputs once seen as type="password" (now possibly revealed as
* type="text"), creating it on first use. Weak references only: inputs removed from the page are
* collected normally.
* @return {WeakSet<HTMLInputElement>} The shared registry.
*/
const getRevealedPasswordRegistry = () => {
  if (!(globalThis[REGISTRY_KEY] instanceof WeakSet)) {
    Object.defineProperty(globalThis, REGISTRY_KEY, {
      value: new WeakSet(),
      enumerable: false,
      configurable: false,
      writable: false
    });
  }

  return globalThis[REGISTRY_KEY];
};

export { getRevealedPasswordRegistry };
