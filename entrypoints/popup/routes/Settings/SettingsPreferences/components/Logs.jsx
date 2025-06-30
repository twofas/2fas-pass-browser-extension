// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState } from 'react';

/**
* Function to render the Logs component.
* @return {JSX.Element} The rendered component.
*/
function Logs () {
  const [loading, setLoading] = useState(true);
  const [l, setL] = useState(null);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const getDefaultLogs = async () => {
      let storageLogging = await storage.getItem('local:logging');

      if (storageLogging === null) {
        storageLogging = false;
      }

      setL(storageLogging);
      setLoading(false);
      setDisabled(false);
    };

    try {
      getDefaultLogs();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const handleChange = async () => {
    setDisabled(true);

    try {
      await storage.setItem('local:logging', !l);
      setL(!l);
      showToast(browser.i18n.getMessage('notification_logging_settings_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_logging_settings_changed'), 'error');
    } finally {
      setDisabled(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={S.settingsLogs}>
      <form action="#" className={bS.passToggle}>
        <input type="checkbox" name="pass-logs" id="pass-logs" defaultChecked={l} onChange={handleChange} disabled={disabled ? 'disabled' : ''} />
        <label htmlFor="pass-logs">
          <span className={bS.passToggleBox}>
            <span className={bS.passToggleBoxCircle} />
          </span>
  
          <span className={bS.passToggleText}>
            <span>{browser.i18n.getMessage('settings_allow_logs')}</span>
          </span>
        </label>
      </form>
    </div>
  );
}

export default Logs;
