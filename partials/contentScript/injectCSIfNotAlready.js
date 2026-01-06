// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '../functions/sendMessageToAllFrames';

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

  const expectedFrameCount = await getInjectableFrameCount(tabID);

  if (expectedFrameCount === 0) {
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
    return true;
  }

  try {
    await injectScript();
  } catch {
    return false;
  }

  let attempts = 0;

  while (attempts < 15) {
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

    if (attempts === 7 && type === REQUEST_TARGETS.CONTENT) {
      try {
        await injectScript();
      } catch {}
    }

    await new Promise(resolve => setTimeout(resolve, 30));

    attempts++;
  }

  return injected;
};

export default injectCSIfNotAlready;
