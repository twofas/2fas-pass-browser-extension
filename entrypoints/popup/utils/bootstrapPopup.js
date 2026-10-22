// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import setTheme from './setTheme.js';
import withTimeout from './withTimeout.js';
import usePopupStateStore from '../store/popupState/index.js';

export const WS_STATE_TIMEOUT_MS = 3000;
export const INIT_TIMEOUT_MS = 3000;

const EXCLUDED_ROUTES = ['/connect', '/', '/fetch', '/blocked'];
const BACKGROUND_NOT_RESPONDING_TOAST_ID = 'popup-background-not-responding';

/**
* Asks the background for the current WebSocket action state.
* @return {Promise<Object|null>} The background response, or null when the request failed.
*/
const requestWsState = async () => {
  try {
    return await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.WS_GET_STATE,
      target: REQUEST_TARGETS.BACKGROUND_WS
    });
  } catch {
    return null;
  }
};

/**
* Applies the WebSocket state reported by the background: routes to an active action and stores the state and pending updates for React.
* @param {Object|null} response - The WS_GET_STATE response.
* @return {boolean} Whether a WebSocket action is active.
*/
const applyWsState = response => {
  if (response?.state?.active) {
    let activeHash;

    if (response.state.type === 'connect_qr' || response.state.type === 'connect_push') {
      activeHash = '#/connect';
    } else if (response.state.type === 'fetch') {
      activeHash = '#/fetch';
    }

    const requestedHash = window.location.hash;
    const isRouteConflict = activeHash && requestedHash && !requestedHash.startsWith(activeHash);

    if (isRouteConflict) {
      const pendingUpdates = response.pendingUpdates || { toasts: [], navigation: null };
      pendingUpdates.toasts = pendingUpdates.toasts || [];
      pendingUpdates.toasts.push({ message: getMessage('ws_action_in_progress'), type: 'info' });
      response.pendingUpdates = pendingUpdates;
    }

    if (activeHash) {
      window.location.hash = activeHash;
    }

    window.__wsInitialState = response.state;
    window.__wsPendingUpdates = response.pendingUpdates;
    return true;
  } else if (response?.pendingUpdates?.toasts?.length > 0 || response?.pendingUpdates?.navigation) {
    window.__wsPendingUpdates = response.pendingUpdates;
  }

  return false;
};

/**
* Pre-hydrates the Zustand store before React renders so popupState (search, scroll, navigation history, etc.) is available on first render.
* Optionally sets the initial hash route based on the last visited href to prevent a flash of ThisTab before navigating to the stored route.
* @param {boolean} skipHashRouting - When true (WS action active or pending navigation already set the hash), only hydrate the store.
*   Never skip hydration itself — that would orphan all popupState across opens.
* @param {Object} deadline - Shared `{ expired }` flag; once the popup has rendered, a late hydration must not change the route.
* @return {Promise<void>}
*/
const hydrateAndSetInitialRoute = async (skipHashRouting, deadline) => {
  try {
    await usePopupStateStore.persist.rehydrate();

    if (skipHashRouting || deadline.expired) {
      return;
    }

    if (window.__wsPendingUpdates?.navigation?.path) {
      window.location.hash = `#${window.__wsPendingUpdates.navigation.path}`;
      return;
    }

    const state = usePopupStateStore.getState();
    const hrefArray = state.href;
    const lastHref = hrefArray.length > 0 ? hrefArray[hrefArray.length - 1] : null;

    if (lastHref && !EXCLUDED_ROUTES.includes(lastHref) && !lastHref.startsWith('/fetch/')) {
      const currentHash = window.location.hash;

      if (currentHash === '' || currentHash === '#' || currentHash === '#/') {
        window.location.hash = `#${lastHref}`;
      }
    }
  } catch (e) {
    CatchError(e);
  }
};

/**
* Queues a persistent toast telling the user that the extension is not responding and the browser needs a restart.
* The toast is shown by Popup.jsx once it has loaded.
*/
const queueBackgroundNotRespondingToast = () => {
  const pendingUpdates = window.__wsPendingUpdates || { toasts: [], navigation: null };
  pendingUpdates.toasts = pendingUpdates.toasts || [];

  if (pendingUpdates.toasts.some(toast => toast.toastId === BACKGROUND_NOT_RESPONDING_TOAST_ID)) {
    return;
  }

  pendingUpdates.toasts.push({
    message: getMessage('popup_background_not_responding'),
    type: 'error',
    autoClose: false,
    toastId: BACKGROUND_NOT_RESPONDING_TOAST_ID
  });

  window.__wsPendingUpdates = pendingUpdates;
};

/**
* Writes a log entry without letting a logger failure break the popup start.
* @param {string} level - Logger method name.
* @param {string} message - Log message.
* @param {Object} meta - Log metadata.
*/
const safeLog = (level, message, meta) => {
  try {
    logger[level](LOGGER_CONSTANTS.CATEGORIES.SYSTEM, message, meta);
  } catch {}
};

/**
* Prepares the popup before React renders: WebSocket state, theme, store hydration and i18n.
* Every stage that depends on the background or on storage has a deadline, so a hung extension process
* (e.g. Safari after an app update applied while it was running) still renders the popup instead of a blank page.
* @return {Promise<void>}
*/
const bootstrapPopup = async () => {
  safeLog('info', 'Popup - bootstrap start', { initialHash: window.location.hash || '' });

  let notResponding = false;
  const deadline = { expired: false };

  const wsResult = await withTimeout(requestWsState(), WS_STATE_TIMEOUT_MS);

  if (wsResult.timedOut) {
    notResponding = true;
    safeLog('warn', 'Popup - background did not answer WS state request', { timeoutMs: WS_STATE_TIMEOUT_MS });
  }

  const wsActive = wsResult.timedOut ? false : applyWsState(wsResult.value);

  const initResult = await withTimeout(
    Promise.all([
      setTheme(),
      hydrateAndSetInitialRoute(wsActive, deadline),
      initI18n()
    ]),
    INIT_TIMEOUT_MS
  );

  if (initResult.timedOut) {
    deadline.expired = true;
    notResponding = true;
    safeLog('warn', 'Popup - initialization timed out', { timeoutMs: INIT_TIMEOUT_MS });
  }

  if (notResponding) {
    queueBackgroundNotRespondingToast();
  }
};

export default bootstrapPopup;
