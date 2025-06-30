// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState } from 'react';

/**
* Function to render the Context Menu component.
* @return {JSX.Element} The rendered component.
*/
function ContextMenu () {
  const [loading, setLoading] = useState(true);
  const [cM, setCM] = useState(null);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const getDefaultContextMenu = async () => {
      let storageContextMenu = await storage.getItem('local:contextMenu');

      if (storageContextMenu === null) {
        storageContextMenu = true;
      }

      setCM(storageContextMenu);
      setLoading(false);
      setDisabled(false);
    };

    try {
      getDefaultContextMenu();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const handleChange = async () => {
    setDisabled(true);

    try {
      await storage.setItem('local:contextMenu', !cM);
      setCM(!cM);
      showToast(browser.i18n.getMessage('notification_context_menu_setting_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_saving_context_menu_setting'), 'error');
      await CatchError(e);
    } finally {
      setDisabled(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={S.settingsContextMenu}>
      <form action="#" className={bS.passToggle}>
        <input type="checkbox" name="pass-context-menu" id="pass-context-menu" defaultChecked={cM} onChange={handleChange} disabled={disabled ? 'disabled' : ''} />
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
