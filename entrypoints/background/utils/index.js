// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Alarms functions
export { default as addAutoClearAction } from './alarmsFunctions/addAutoClearAction.js';
export { default as autoClearClipboard } from './alarmsFunctions/autoClearClipboard.js';
export { default as sifT2Reset } from './alarmsFunctions/sifT2Reset.js';

// Badge functions
export { default as setBadgeIcon } from './badge/setBadgeIcon.js';
export { default as setBadgeLocked } from './badge/setBadgeLocked.js';
export { default as setBadgeText } from './badge/setBadgeText.js';
export { default as updateBadge } from './badge/updateBadge.js';

// Save prompt functions
export { default as addSavePromptAction } from './savePrompt/addSavePromptAction.js';
export { default as checkDomainOnIgnoredList } from './savePrompt/checkDomainOnIgnoredList.js';
export { default as checkFormData } from './savePrompt/checkFormData.js';
export { default as checkServicesData } from './savePrompt/checkServicesData.js';
export { default as cleanTabsInputData } from './savePrompt/cleanTabsInputData.js';
export { default as decryptValues } from './savePrompt/decryptValues.js';
export { default as decryptValuesProcess } from './savePrompt/decryptValuesProcess.js';
export { default as getValuesFromTabsInputData } from './savePrompt/getValuesFromTabsInputData.js';
export { default as handleSavePromptResponse } from './savePrompt/handleSavePromptResponse.js';
export { default as removeSavePromptAction } from './savePrompt/removeSavePromptAction.js';
export { default as savePromptAction } from './savePrompt/savePromptAction.js';

// Core utilities
export { default as generateLocalKey } from './generateLocalKey.js';
export { default as generatePersistentKeys } from './generatePersistentKeys.js';
export { default as generateSecurityIcon } from './generateSecurityIcon.js';
export { default as getBrowserInfo } from './getBrowserInfo.js';
export { default as getBrowserVersion } from './getBrowserVersion.js';
export { default as getLocalKey } from './getLocalKey.js';
export { default as getOSName } from './getOSName.js';
export { default as isBrave } from './isBrave.js';
export { default as openBrowserPage } from './openBrowserPage.js';
export { default as openInstallPage } from './openInstallPage.js';
export { default as openPopupWindowInNewWindow } from './openPopupWindowInNewWindow.js';
export { default as promptInput } from './promptInput.js';
export { default as sendAutoClearAction } from './sendAutoClearAction.js';
export { default as sendAutofillToTab } from './sendAutofillToTab.js';
export { default as sendDomainToPopupWindow } from './sendDomainToPopupWindow.js';
export { default as sendMatchingLoginsToTab } from './sendMatchingLoginsToTab.js';
export { default as sendSavePromptToTab } from './sendSavePromptToTab.js';
export { default as shortcutAutofill } from './shortcutAutofill.js';
export { default as updateContextMenu } from './updateContextMenu.js';
