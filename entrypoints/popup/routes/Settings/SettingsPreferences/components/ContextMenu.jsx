// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState, useCallback } from 'react';

/**
* Function to render the Context Menu component.
* @return {JSX.Element} The rendered component.
*/
function ContextMenu () {
  const [cM, setCM] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const getDefaultContextMenu = async () => {
      try {
        let storageContextMenu = await storage.getItem('local:contextMenu');

        if (storageContextMenu === null) {
          storageContextMenu = true;
          await storage.setItem('local:contextMenu', storageContextMenu);
        }

        setCM(storageContextMenu);
        setIsInitialized(true);
      } catch (e) {
        await CatchError(e);
        setIsInitialized(true);
      }
    };

    getDefaultContextMenu();
  }, []);

  const handleChange = useCallback(async () => {
    if (!isInitialized) {
      return;
    }

    try {
      const newValue = !cM;
      setCM(newValue);

      await storage.setItem('local:contextMenu', newValue);
      showToast(browser.i18n.getMessage('notification_settings_save_success'), 'success');
    } catch (e) {
      const previousValue = await storage.getItem('local:contextMenu');
      setCM(previousValue !== null ? previousValue : true);

      showToast(browser.i18n.getMessage('error_general_setting'), 'error');
      await CatchError(e);
    }
  }, [cM, isInitialized]);

  return (
    <div className={S.settingsContextMenu}>
      <form action="#" className={bS.passToggle}>
        <input
          type="checkbox"
          name="pass-context-menu"
          id="pass-context-menu"
          checked={cM}
          onChange={handleChange}
          disabled={!isInitialized ? 'disabled' : ''}
        />
        <label htmlFor="pass-context-menu">
          <span className={bS.passToggleBox}>
            <span className={bS.passToggleBoxCircle} />
          </span>

          <span className={bS.passToggleText}>
            <span>{browser.i18n.getMessage('settings_context_menu_text')}</span>
          </span>
        </label>
      </form>
    </div>
  );
}

export default ContextMenu;
