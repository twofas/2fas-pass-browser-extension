// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const REQUEST_ACTIONS = Object.freeze({
  AUTO_CLEAR_ACTION: 'autoClearAction', // background, focus, popup
  AUTOFILL: 'autofill', // content
  AUTOFILL_CARD: 'autofillCard', // content
  AUTOFILL_CARD_WITH_PERMISSION: 'autofillCardWithPermission', // background
  CHECK_AUTOFILL_INPUTS: 'checkAutofillInputs', // content
  CHECK_AUTOFILL_INPUTS_CARD: 'checkAutofillInputsCard', // content
  CHECK_IFRAME_PERMISSION: 'checkIframePermission', // content
  SHOW_CROSS_DOMAIN_CONFIRM: 'showCrossDomainConfirm', // content
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
  IGNORE_SAVE_PROMPT: 'ignoreSavePrompt', // prompt, popup, background
  GET_CRYPTO_AVAILABLE: 'getCryptoAvailable', // popup, content
  GET_SAVE_PROMPT: 'getSavePrompt', // prompt, background
  TAB_FOCUS: 'tabFocus', // focus, background
  UPDATE_AVAILABLE: 'updateAvailable', // background, this_tab
  FOCUS_CHECK: 'focusCheck', // background, popup, focus
  NEW_POPUP: 'newPopup', // popup
});
