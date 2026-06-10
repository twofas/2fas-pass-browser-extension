// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '../functions/sendMessageToAllFrames';
import isInjectionVerified from './isInjectionVerified';
import isRecentlyVerifiedInjection from './isRecentlyVerifiedInjection';

/**
* Caches the timestamp (ms) of the last verified content-script injection per
* tab + script type, so the repeated calls within a single autofill pass (entry,
* resolveCrossDomainPermissions + its retry, pre-AUTOFILL re-check) can skip the
* full getAllFrames + polling loop and take a quick top-frame liveness check
* instead. Module-scoped: lives for the background service worker / popup
* lifetime and is rebuilt from scratch after a service-worker restart.
* @type {Map<string, number>}
*/
const verifiedInjectionCache = new Map();

/**
* Gets the count of injectable frames in a tab.
* @async
* @param {number} tabID - The ID of the tab.
* @return {Promise<number>} The number of injectable frames.
*/
const getInjectableFrameCount = async tabID => {
  let frames;

  try {
    frames = await browser.webNavigation.getAllFrames({ tabId: tabID });
  } catch {
    return 0;
  }

  if (!frames || frames.length <= 0) {
    return 0;
  }

  const injectableFrames = frames.filter(frame => {
    // FUTURE - improve that logic + add other browser specifics
    if (!frame.url || frame.url === 'about:blank') {
      return false;
    }

    if (frame.url.startsWith('chrome://') || frame.url.startsWith('chrome-extension://')) {
      return false;
    }

    if (frame.url.startsWith('moz-extension://') || frame.url.startsWith('about:')) {
      return false;
    }

    return frame.url.startsWith('http://') || frame.url.startsWith('https://');
  });

  return injectableFrames.length;
};

/**
* Injects the content script and CSS if not already injected.
* @async
* @param {number} tabID - The ID of the tab to inject the content script and CSS into.
* @param {string} type - The type of content script to inject.
* @return {boolean} Indicates whether the content script was successfully injected.
*/
const injectCSIfNotAlready = async (tabID, type = REQUEST_TARGETS.CONTENT) => { // content / prompt
  const injectScript = async () => {
    switch (type) {
      case REQUEST_TARGETS.CONTENT: {
        await browser.scripting.executeScript({
          target: { tabId: tabID, allFrames: true },
          files: ['content-scripts/content.js'],
          injectImmediately: true
        });
        break;
      }

      case REQUEST_TARGETS.PROMPT: {
        await browser.scripting.executeScript({
          target: { tabId: tabID, allFrames: false },
          files: ['content-scripts/prompt.js'],
          injectImmediately: true
        });
        break;
      }

      default: {
        throw new TwoFasError(TwoFasError.internalErrors.injectCSIfNotAlreadyUnknownTypeError);
      }
    }
  };

  const cacheKey = `${tabID}:${type}`;

  if (isRecentlyVerifiedInjection({ verifiedAt: verifiedInjectionCache.get(cacheKey), now: Date.now() })) {
    // A full verification succeeded moments ago in the same autofill pass. Confirm
    // the top frame's content script is still alive with a single quick check (no
    // getAllFrames, no polling, no re-injection) instead of repeating the expensive
    // up-to-30×50ms loop. The check self-validates against a navigation: if the page
    // changed and the script is gone, the top frame stops answering and we fall
    // through to the full path. Uncooperative sub-frames (ads/trackers) are ignored
    // here exactly as the full path's stabilised-top-frame policy already ignores them.
    try {
      const topRes = await browser.tabs.sendMessage(
        tabID,
        { action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: type },
        { frameId: 0 }
      );

      if (topRes?.status === 'ok') {
        verifiedInjectionCache.set(cacheKey, Date.now());
        return true;
      }
    } catch {}

    verifiedInjectionCache.delete(cacheKey);
  }

  let expectedFrameCount = await getInjectableFrameCount(tabID);

  if (expectedFrameCount === 0) {
    logger.warn(LOGGER_CONSTANTS.CATEGORIES.CONTENT, 'injectCSIfNotAlready - no injectable frames', { tabID, type });
    verifiedInjectionCache.delete(cacheKey);
    return false;
  }

  let res;
  let beforeAttempts = 0;
  let injected = false;

  while (beforeAttempts < 5) {
    try {
      res = await sendMessageToAllFrames(tabID, { action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: type });
    } catch {}

    if (res) {
      const okResponses = res.filter(frameResponse => frameResponse?.status === 'ok');

      if (okResponses && okResponses.length >= expectedFrameCount) {
        injected = true;
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 20));

    beforeAttempts++;
  }

  if (injected === true) {
    verifiedInjectionCache.set(cacheKey, Date.now());
    return true;
  }

  try {
    await injectScript();
  } catch (e) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.CONTENT, 'injectCSIfNotAlready - executeScript failed', { tabID, type, errorName: e?.name, errorMessage: e?.message });
    verifiedInjectionCache.delete(cacheKey);
    return false;
  }

  let attempts = 0;
  const maxAttempts = 30;
  const stableThreshold = 4;
  let lastOkCount = -1;
  let stableIterations = 0;

  while (attempts < maxAttempts) {
    try {
      res = await sendMessageToAllFrames(tabID, { action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: type });
    } catch {}

    if (res) {
      const okResponses = res.filter(frameResponse => frameResponse?.status === 'ok');
      const okCount = okResponses ? okResponses.length : 0;
      const currentFrameCount = await getInjectableFrameCount(tabID);

      if (currentFrameCount > expectedFrameCount) {
        try {
          await injectScript();
        } catch {}
      }

      expectedFrameCount = currentFrameCount;

      if (okCount === lastOkCount) {
        stableIterations++;
      } else {
        stableIterations = 0;
        lastOkCount = okCount;
      }

      let topFrameReady = false;

      if (stableIterations >= stableThreshold && okCount < expectedFrameCount) {
        try {
          const topRes = await browser.tabs.sendMessage(
            tabID,
            { action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: type },
            { frameId: 0 }
          );

          topFrameReady = topRes?.status === 'ok';
        } catch {}
      }

      if (isInjectionVerified({ okCount, frameCount: expectedFrameCount, topFrameReady, stableIterations, stableThreshold })) {
        injected = true;
        break;
      }
    }

    if ((attempts === 7 || attempts === 15) && type === REQUEST_TARGETS.CONTENT) {
      try {
        await injectScript();
      } catch {}
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    attempts++;
  }

  if (!injected) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.CONTENT, 'injectCSIfNotAlready - injection verification timed out', { tabID, type, expectedFrameCount, attempts });
    verifiedInjectionCache.delete(cacheKey);
  } else {
    verifiedInjectionCache.set(cacheKey, Date.now());
  }

  return injected;
};

export default injectCSIfNotAlready;
