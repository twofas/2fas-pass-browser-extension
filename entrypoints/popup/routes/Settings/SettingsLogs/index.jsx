// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import { getLogStats } from '@/partials/logger/idb';
import { exportLogsToFile } from '@/partials/logger/exportLogs';

function SettingsLogs (props) {
  const { getMessage } = useI18n();
  const [stats, setStats] = useState({ entryCount: 0, bytesUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      const result = await getLogStats();
      setStats(result);
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const result = await exportLogsToFile({ bytesUsed: stats.bytesUsed });

      if (!result.exported && result.reason === 'empty') {
        showToast(getMessage('settings_logs_empty_toast'), 'info');

        return;
      }

      showToast(getMessage('settings_logs_download_success'), 'success');
    } catch (e) {
      CatchError(e);
      showToast(getMessage('settings_logs_download_error'), 'error');
    } finally {
      setBusy(false);
    }
  }, [busy, stats.bytesUsed]);

  useEffect(function loadSettingsLogsStats() {
    let active = true;
    let channel = null;

    const init = async () => {
      await refreshStats();

      if (active) {
        setLoading(false);
      }
    };

    init();

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(LOGGER_CONSTANTS.BROADCAST_CHANNEL);

        channel.onmessage = () => {
          if (active) {
            refreshStats();
          }
        };
      }
    } catch {
      channel = null;
    }

    return function teardownSettingsLogs() {
      active = false;

      if (channel) {
        try {
          channel.close();
        } catch {}

        channel = null;
      }
    };
  }, [refreshStats]);

  if (loading) {
    return null;
  }

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.settings}>
          <NavigationButton type='back' />
          <NavigationButton type='cancel' />

          <div className={`${S.settingsContainer} ${S.submenuContainer}`}>
            <div className={S.settingsSubmenu}>
              <div className={S.settingsSubmenuHeader}>
                <h3>{getMessage('settings_logs_title')}</h3>
              </div>

              <div className={S.settingsSubmenuBody}>
                <p className={S.settingsLogsDescription}>
                  {getMessage('settings_logs_description')}
                </p>

                <p className={S.settingsLogsDescription}>
                  {getMessage('settings_logs_send_to_team')}
                </p>

                <div className={S.settingsLogsActions}>
                  <button
                    type='button'
                    className={`${bS.btn} ${bS.btnTheme}`}
                    onClick={handleDownload}
                    disabled={busy || stats.entryCount === 0}
                  >
                    {getMessage('settings_logs_download_button')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsLogs;
