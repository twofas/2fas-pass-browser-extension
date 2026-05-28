// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './DevPanel.module.scss';
import { useState, useCallback } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import LogsTab from './tabs/LogsTab';
import StorageLocalTab from './tabs/StorageLocalTab';
import StorageSessionTab from './tabs/StorageSessionTab';
import WebSocketTab from './tabs/WebSocketTab';

const TABS = Object.freeze({
  LOGS: 'logs',
  STORAGE_LOCAL: 'storageLocal',
  STORAGE_SESSION: 'storageSession',
  WEBSOCKET: 'webSocket'
});

function DevPanel () {
  const { getMessage } = useI18n();
  const [active, setActive] = useState(TABS.LOGS);

  const handleSelect = useCallback(tab => () => setActive(tab), []);

  return (
    <div className={S.devPanel}>
      <header className={S.devPanelHeader}>
        <h1>{getMessage('devpanel_title')}</h1>
      </header>

      <nav className={S.devPanelTabs}>
        <button
          type='button'
          className={active === TABS.LOGS ? S.devPanelTabActive : ''}
          onClick={handleSelect(TABS.LOGS)}
        >
          {getMessage('devpanel_tab_logs')}
        </button>
        <button
          type='button'
          className={active === TABS.STORAGE_LOCAL ? S.devPanelTabActive : ''}
          onClick={handleSelect(TABS.STORAGE_LOCAL)}
        >
          {getMessage('devpanel_tab_storage_local')}
        </button>
        <button
          type='button'
          className={active === TABS.STORAGE_SESSION ? S.devPanelTabActive : ''}
          onClick={handleSelect(TABS.STORAGE_SESSION)}
        >
          {getMessage('devpanel_tab_storage_session')}
        </button>
        <button
          type='button'
          className={active === TABS.WEBSOCKET ? S.devPanelTabActive : ''}
          onClick={handleSelect(TABS.WEBSOCKET)}
        >
          {getMessage('devpanel_tab_websocket')}
        </button>
      </nav>

      <main className={S.devPanelBody}>
        {active === TABS.LOGS && <LogsTab />}
        {active === TABS.STORAGE_LOCAL && <StorageLocalTab />}
        {active === TABS.STORAGE_SESSION && <StorageSessionTab />}
        {active === TABS.WEBSOCKET && <WebSocketTab />}
      </main>
    </div>
  );
}

export default DevPanel;
