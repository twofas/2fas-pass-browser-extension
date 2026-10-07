// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import filterInjectableFrames from '@/partials/functions/filterInjectableFrames';
import isFrameSameRootDomain from '@/entrypoints/background/utils/savePrompt/isFrameSameRootDomain';

/**
* Function to pick the frames prompt.js can capture in: the top frame and same-root-domain frames, the same rule as
* isSavePromptSenderEligible. Cross-root-domain frames (captchas, SSO widgets, embeds) never get prompt.js.
* @param {Array} frames - The frames from webNavigation.getAllFrames.
* @return {Array} The frames that need prompt.js.
*/
export const getPromptFrames = frames => {
  const injectableFrames = filterInjectableFrames(frames || []);
  const topFrame = injectableFrames.find(frame => frame.frameId === 0);

  if (!topFrame) {
    return [];
  }

  return injectableFrames.filter(frame => frame.frameId === 0 || isFrameSameRootDomain(frame.url, topFrame.url));
};

/**
* Function to check whether a frame already runs prompt.js.
* @async
* @param {number} tabId - The ID of the tab.
* @param {number} frameId - The ID of the frame.
* @return {Promise<boolean>} True when prompt.js answers in the frame.
*/
const frameHasPromptCS = async (tabId, frameId) => {
  try {
    const res = await browser.tabs.sendMessage(
      tabId,
      { action: REQUEST_ACTIONS.CONTENT_SCRIPT_CHECK, target: REQUEST_TARGETS.PROMPT },
      { frameId }
    );

    return res?.status === 'ok';
  } catch {
    return false;
  }
};

/**
* Injects prompt.js into the frames that need it and do not run it yet. Frames that already run it are left alone,
* so a tab 'complete' fired by an iframe navigation never re-executes prompt.js in the top frame.
* @async
* @param {number} tabId - The ID of the tab.
* @return {Promise<boolean>} True when the top frame runs prompt.js after the call.
*/
const injectPromptCSIntoFrames = async tabId => {
  let frames;

  try {
    frames = await browser.webNavigation.getAllFrames({ tabId });
  } catch {
    return false;
  }

  const promptFrames = getPromptFrames(frames);

  if (promptFrames.length <= 0) {
    return false;
  }

  const present = await Promise.all(promptFrames.map(frame => frameHasPromptCS(tabId, frame.frameId)));
  const missingFrameIds = promptFrames.filter((frame, index) => !present[index]).map(frame => frame.frameId);

  if (missingFrameIds.length <= 0) {
    return true;
  }

  // One call per frame: a frame that navigated away since getAllFrames fails alone instead of the whole injection.
  const results = await Promise.allSettled(missingFrameIds.map(frameId => browser.scripting.executeScript({
    target: { tabId, frameIds: [frameId] },
    files: ['content-scripts/prompt.js'],
    injectImmediately: true
  })));

  const topIndex = missingFrameIds.indexOf(0);

  if (topIndex === -1) {
    return true;
  }

  if (results[topIndex].status === 'rejected') {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.CONTENT, 'injectPromptCSIntoFrames - executeScript failed', { tabId, errorMessage: results[topIndex].reason?.message });
    return false;
  }

  return true;
};

export default injectPromptCSIntoFrames;
