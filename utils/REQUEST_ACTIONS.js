// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const REQUEST_ACTIONS = {
  AUTO_CLEAR_CLIPBOARD: 'autoClearClipboard', // content, popup
  AUTOFILL: 'autofill', // content
  CHECK_AUTOFILL_INPUTS: 'checkAutofillInputs', // content
  SEND_URL: 'sendUrl', // popup
  MATCHING_LOGINS: 'matchingLogins', // content
  SAVE_PROMPT: 'savePrompt', // content
  CONTENT_SCRIPT_CHECK: 'contentScriptCheck', // content, prompt
  NOTIFICATION: 'notification', // content
  GET_DOMAIN_INFO: 'getDomainInfo', // content
  PROMPT_INPUT: 'promptInput', // background prompt
  OPEN_BROWSER_PAGE: 'openBrowserPage', // background, popup
  OPEN_POPUP_WINDOW_IN_NEW_WINDOW: 'openPopupWindowInNewWindow', // background, popup
  GET_LOCAL_KEY: 'getLocalKey', // background, prompt, popup, content
  RESET_EXTENSION: 'resetExtension', // background, popup
  IGNORE_SAVE_PROMPT: 'ignoreSavePrompt' // prompt, popup, background
};
