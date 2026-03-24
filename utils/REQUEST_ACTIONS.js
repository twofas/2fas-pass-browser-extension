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
  AUTOFILL_WITH_PERMISSION: 'autofillWithPermission', // background
  CHECK_AUTOFILL_INPUTS: 'checkAutofillInputs', // content
  CHECK_AUTOFILL_INPUTS_CARD: 'checkAutofillInputsCard', // content
  CHECK_IFRAME_PERMISSION: 'checkIframePermission', // content
  SHOW_CROSS_DOMAIN_CONFIRM: 'showCrossDomainConfirm', // content
  CROSS_DOMAIN_DIALOG_RESULT: 'crossDomainDialogResult', // background (from content script)
  MATCHING_LOGINS_RESULT: 'matchingLoginsResult', // background (from content script)
  SAVE_PROMPT_RESULT: 'savePromptResult', // background (from content script)
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
  REFRESH_THEME: 'refreshTheme', // content (top frame only)
  REFRESH_LANG: 'refreshLang', // content (top frame only)
  GET_I18N_DATA: 'getI18nData', // background (returns lang and messages for content scripts)
  SIF_T2_RESET: 'sifT2Reset', // background → popup (notifies that a T2 item's SIF was reset)
  PROMPT_INPUT_FLUSH: 'promptInputFlush', // background prompt (bulk flush before page unload)
  WS_CONNECT_QR: 'wsConnectQr', // popup → background_ws (start QR connection)
  WS_CONNECT_PUSH: 'wsConnectPush', // popup → background_ws (start push connection)
  WS_FETCH: 'wsFetch', // popup → background_ws (start fetch action)
  WS_CANCEL: 'wsCancel', // popup → background_ws (cancel current WS action)
  WS_GET_STATE: 'wsGetState', // popup → background_ws (get current WS state)
  WS_STATE_UPDATE: 'wsStateUpdate', // background_ws → popup (state update notification)
  WS_RELOAD_QR: 'wsReloadQr', // popup → background_ws (reload QR code after error)
  CHECK_SHARE_LINK_SUPPORT: 'checkShareLinkSupport', // share content → background (check device shareLink feature)
  SHARE_LINK_IMPORT: 'shareLinkImport', // share content → background (open popup to import share link)
  SHARE_LINK_STATE_CHANGE: 'shareLinkStateChange', // background → share content (configured/locked state change)
});
