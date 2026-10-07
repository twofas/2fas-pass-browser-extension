// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { getRevealedPasswordRegistry } from '@/partials/inputFunctions/revealedPasswordRegistry';

/**
* Records inputs a "show password" toggle flips from type="password" to type="text", so the
* autofill script injected later still treats them as password fields. Observes only `type`
* attribute mutations (with the old value) — the callback runs solely when a type attribute
* changes, which keeps the cost on this always-loaded script negligible.
* @return {Function} Cleanup function that stops watching.
*/
const watchRevealedPasswordInputs = () => {
  if (typeof MutationObserver !== 'function' || !document?.documentElement) {
    return () => {};
  }

  const registry = getRevealedPasswordRegistry();

  const observer = new MutationObserver(records => {
    for (const record of records) {
      const wasPassword = (record.oldValue || '').trim().toLowerCase() === 'password';

      if (wasPassword && record.target?.tagName === 'INPUT') {
        registry.add(record.target);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['type'],
    attributeOldValue: true,
    subtree: true
  });

  return () => observer.disconnect();
};

export default watchRevealedPasswordInputs;
