// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItems from '@/partials/sessionStorage/getItems';
import sendAutofillToTab from './utils/sendAutofillToTab';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import { sendMessageToAllFrames } from '@/partials/functions';

// DEV-only message handler for the autofill E2E harness (tests/e2e/autofill). Wired
// into the single background message router (createMessageRouter) under target 'e2e',
// rather than as a separate runtime.onMessage listener, so it shares the exact path
// the extension's own messages use (no multi-listener races, and the worker startup
// runs before dispatch). The harness relays these messages from the popup page (a real
// extension context). Tree-shaken from production: the router only calls this inside
// `if (import.meta.env.DEV && request.target === 'e2e')`.

/**
* Handles a DEV-only 'e2e' message from the autofill E2E harness.
* @param {Object} request - The message (action: 'getAutofillItem' | 'autofill').
* @param {Function} sendResponse - The response callback.
* @return {boolean} True to keep the message channel open for the async response.
*/
const handleE2EMessage = (request, sendResponse) => {
  // Returns the full Login count plus one Login that is Secret-tier (2) AND has both
  // a username and a password — the only kind the harness should autofill-and-assert.
  if (request.action === 'getAutofillItem') {
    (async () => {
      try {
        const items = await getItems(['Login']);
        const list = Array.isArray(items) ? items : [];
        const suitable = list.find(i =>
          i?.securityType === SECURITY_TIER.SECRET &&
          i?.sifExists === true &&
          typeof i?.content?.username === 'string' &&
          i.content.username.length > 0
        );

        const result = { total: list.length };

        if (suitable) {
          result.deviceId = suitable.deviceId;
          result.vaultId = suitable.vaultId;
          result.itemId = suitable.id;
          result.username = suitable.content.username;
        }

        sendResponse(result);
      } catch (e) {
        sendResponse({ total: 0, error: e?.message || String(e) });
      }
    })();

    return true;
  }

  // Runs the real keyboard-shortcut autofill flow for a specific item.
  if (request.action === 'autofill') {
    (async () => {
      try {
        await sendAutofillToTab(request.tabId, request.deviceId, request.vaultId, request.itemId);
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ error: e?.message || String(e) });
      }
    })();

    return true;
  }

  // Runs the extension's REAL detection across every frame — injecting the content
  // script first, exactly like sendAutofillToTab — and OR-aggregates the answers. The
  // harness gates "is there a login form?" on THIS (checkAutofillInputs()), so it tests
  // what the extension can actually autofill, not a parallel DOM heuristic.
  if (request.action === 'detect') {
    (async () => {
      try {
        await injectCSIfNotAlready(request.tabId, REQUEST_TARGETS.CONTENT);

        const res = await sendMessageToAllFrames(request.tabId, {
          action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
          target: REQUEST_TARGETS.CONTENT
        });
        const frames = Array.isArray(res) ? res.filter(r => r && typeof r === 'object') : [];

        sendResponse({
          canAutofillUsername: frames.some(r => r.canAutofillUsername),
          canAutofillPassword: frames.some(r => r.canAutofillPassword),
          usernameInputsCount: frames.reduce((n, r) => n + (r.usernameInputsCount || 0), 0),
          passwordInputsCount: frames.reduce((n, r) => n + (r.passwordInputsCount || 0), 0)
        });
      } catch (e) {
        sendResponse({ error: e?.message || String(e) });
      }
    })();

    return true;
  }

  // Reads back the values of the exact inputs autofill() targets (getLoginInputs), via
  // the same inject + all-frames messaging — so the harness verifies a fill using the
  // extension's own selection + visibility logic. Returns username values and password
  // LENGTHS (never password content).
  if (request.action === 'readValues') {
    (async () => {
      try {
        await injectCSIfNotAlready(request.tabId, REQUEST_TARGETS.CONTENT);

        const res = await sendMessageToAllFrames(request.tabId, {
          action: REQUEST_ACTIONS.E2E_READ_AUTOFILL_VALUES,
          target: REQUEST_TARGETS.CONTENT
        });
        const frames = Array.isArray(res) ? res.filter(r => r && typeof r === 'object') : [];

        sendResponse({
          usernameValues: frames.flatMap(r => (Array.isArray(r.usernameValues) ? r.usernameValues : [])),
          passwordLengths: frames.flatMap(r => (Array.isArray(r.passwordLengths) ? r.passwordLengths : []))
        });
      } catch (e) {
        sendResponse({ error: e?.message || String(e) });
      }
    })();

    return true;
  }

  sendResponse({ error: `unknown e2e action: ${request.action}` });

  return true;
};

export default handleE2EMessage;
