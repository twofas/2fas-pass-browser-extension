// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState, useCallback } from 'react';

/**
* Function to render the Logs component.
* @return {JSX.Element} The rendered component.
*/
function Logs () {
  const [l, setL] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const getDefaultLogs = async () => {
      try {
        let storageLogging = await storage.getItem('local:logging');

        if (storageLogging === null) {
          storageLogging = false;
          await storage.setItem('local:logging', storageLogging);
        }

        setL(storageLogging);
        setIsInitialized(true);
      } catch (e) {
        await CatchError(e);
        setIsInitialized(true);
      }
    };

    getDefaultLogs();
  }, []);

  const handleChange = useCallback(async () => {
    if (!isInitialized) {
      return;
    }

    try {
      const newValue = !l;
      setL(newValue);

      await storage.setItem('local:logging', newValue);
      showToast(browser.i18n.getMessage('notification_settings_save_success'), 'success');
    } catch (e) {
      const previousValue = await storage.getItem('local:logging');
      setL(previousValue !== null ? previousValue : false);

      showToast(browser.i18n.getMessage('error_general_setting'), 'error');
      await CatchError(e);
    }
  }, [l, isInitialized]);

  return (
    <div className={S.settingsLogs}>
      <form action="#" className={bS.passToggle}>
        <input
          type="checkbox"
          name="pass-logs"
          id="pass-logs"
          checked={l}
          onChange={handleChange}
          disabled={!isInitialized ? 'disabled' : ''}
        />
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
