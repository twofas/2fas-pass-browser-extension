// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { onTabUpdated, onTabActivated, onTabCreated, onTabRemoved } from './tabs';
import { createMessageRouter, onInstalled, onContextMenuClick, onStorageChange, onAlarm, onCommand, onStartup } from './events';
import nonSafariBackground from './nonSafariBackground';
import firefoxBackground from './firefoxBackground';
import initBadgeState from './utils/badge/initBadgeState';
import onPopupDisconnect from './websocket/onPopupDisconnect.js';

export default defineBackground({
  /**
  * Main function that initializes the background script.
  * @return {void}
  */
  main () {
    initI18n();

    const tabsInputData = {};
    const tabUpdateData = {};
    const savePromptActions = [];
    const migrations = { state: false };

    // Fallback: Set migrations to true after a short delay if not set by onInstalled/onStartup
    // This handles edge cases where neither event fires (e.g., extension reload during development)
    setTimeout(() => {
      if (!migrations.state) {
        migrations.state = true;
      }
    }, 1000);

    browser.runtime.onInstalled.addListener(async details => await onInstalled(details, migrations));
    browser.runtime.onMessage.addListener(createMessageRouter({ migrations, tabsInputData }));
    browser.runtime.onStartup.addListener(() => onStartup(migrations));

    if (browser?.commands?.onCommand) {
      browser.commands.onCommand.addListener(onCommand);
    }
    
    browser.contextMenus.onClicked.addListener(onContextMenuClick);

    browser.tabs.onCreated.addListener(tab => onTabCreated(tab, tabsInputData));
    browser.tabs.onUpdated.addListener((tab, changeInfo) => onTabUpdated(tab, changeInfo, savePromptActions, tabUpdateData));
    browser.tabs.onActivated.addListener(onTabActivated);
    browser.tabs.onRemoved.addListener(tabId => onTabRemoved(tabId, tabsInputData, savePromptActions));

    browser.alarms.onAlarm.addListener(onAlarm);

    browser.storage.onChanged.addListener((change, areaName) => onStorageChange(change, areaName, migrations));

    browser.runtime.onConnect.addListener(port => {
      if (port.name === 'popup-lifecycle') {
        port.onDisconnect.addListener(() => onPopupDisconnect());
      }
    });

    if (import.meta.env.BROWSER !== 'safari') {
      nonSafariBackground(tabsInputData, savePromptActions, tabUpdateData);
    }

    if (import.meta.env.BROWSER === 'firefox') {
      firefoxBackground();
    }

    initBadgeState();
}});
