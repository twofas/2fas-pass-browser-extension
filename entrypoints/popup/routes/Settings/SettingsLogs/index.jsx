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
import ConfirmDialog from '@/entrypoints/popup/components/ConfirmDialog';
import { readAllLogs, getLogStats, clearLogs } from '@/partials/logger/idb';

const fileSafeTimestamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

const serializeExport = data => {
  const metaPretty = JSON.stringify(data.meta, null, 2)
    .split('\n')
    .map((line, idx) => idx === 0 ? line : `  ${line}`)
    .join('\n');

  const total = data.logs.length;
  const entryLines = data.logs.map((entry, idx) => {
    const trailing = idx === total - 1 ? '' : ',';
    return `    ${JSON.stringify(entry)}${trailing}`;
  });

  if (entryLines.length === 0) {
    return `{\n  "meta": ${metaPretty},\n  "logs": []\n}\n`;
  }

  return `{\n  "meta": ${metaPretty},\n  "logs": [\n${entryLines.join('\n')}\n  ]\n}\n`;
};

const triggerDownload = (filename, jsonString) => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

function SettingsLogs (props) {
  const { getMessage } = useI18n();
  const [stats, setStats] = useState({ entryCount: 0, bytesUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
      const [entries, manifest, browserInfo] = await Promise.all([
        readAllLogs(),
        Promise.resolve(browser.runtime.getManifest()),
        storage.getItem('local:browserInfo').catch(() => null)
      ]);

      if (!entries || entries.length === 0) {
        showToast(getMessage('settings_logs_empty_toast'), 'info');
        setBusy(false);

        return;
      }

      const exportObject = {
        meta: {
          exportedAt: new Date().toISOString(),
          appVersion: manifest?.version || 'unknown',
          appName: manifest?.name || 'unknown',
          browser: import.meta.env.BROWSER,
          browserName: browserInfo?.browserName || null,
          browserVersion: browserInfo?.browserVersion || null,
          entryCount: entries.length,
          bytesUsed: stats.bytesUsed
        },
        logs: entries
      };

      const filename = `2fas-pass-logs-${import.meta.env.BROWSER}-${manifest?.version || 'unknown'}-${fileSafeTimestamp()}.json`;
      triggerDownload(filename, serializeExport(exportObject));
      showToast(getMessage('settings_logs_download_success'), 'success');
    } catch (e) {
      CatchError(e);
      showToast(getMessage('settings_logs_download_error'), 'error');
    } finally {
      setBusy(false);
    }
  }, [busy, stats.bytesUsed]);

  const handleClearClick = useCallback(() => {
    if (busy) {
      return;
    }

    setConfirmOpen(true);
  }, [busy]);

  const handleClearCancel = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const handleClearConfirm = useCallback(async () => {
    setConfirmOpen(false);
    setBusy(true);

    try {
      await clearLogs();
      await refreshStats();
      showToast(getMessage('settings_logs_clear_success'), 'success');
    } catch (e) {
      CatchError(e);
      showToast(getMessage('settings_logs_clear_error'), 'error');
    } finally {
      setBusy(false);
    }
  }, [refreshStats]);

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
    <>
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

                <div className={`${S.settingsSubmenuBody} ${S.smallMargin}`}>
                  <p className={S.settingsLogsDescription}>
                    {getMessage('settings_logs_description')}
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

                    <button
                      type='button'
                      className={`${bS.btn} ${bS.btnDanger}`}
                      onClick={handleClearClick}
                      disabled={busy || stats.entryCount === 0}
                    >
                      {getMessage('settings_logs_clear_button')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        message={getMessage('settings_logs_clear_confirm')}
        cancelText={getMessage('settings_logs_clear_confirm_cancel')}
        confirmText={getMessage('settings_logs_clear_confirm_ok')}
        onCancel={handleClearCancel}
        onConfirm={handleClearConfirm}
      />
    </>
  );
}

export default SettingsLogs;
