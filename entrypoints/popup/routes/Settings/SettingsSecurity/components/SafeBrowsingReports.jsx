// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState } from 'react';

/**
* Function to render the Safe Browsing Reports component.
* @return {JSX.Element} The rendered component.
*/
function SafeBrowsingReports () {
  const [loading, setLoading] = useState(true);
  const [sbr, setSbr] = useState(null);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const getDefaultSafeBrowsingReports = async () => {
      const browserSafeBrowsingReports = await browser.privacy.services.safeBrowsingExtendedReportingEnabled.get({});
      setSbr(browserSafeBrowsingReports);
      setLoading(false);
      setDisabled(false);
    };

    try {
      getDefaultSafeBrowsingReports();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const handleChange = async () => {
    setDisabled(true);

    try {
      await browser.privacy.services.safeBrowsingExtendedReportingEnabled.set({ value: !sbr });
      setSbr(!sbr);
      showToast(browser.i18n.getMessage('notification_settings_save_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_general_setting'), 'error');
      await CatchError(e);
    } finally {
      setDisabled(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={S.settingsSafeBrowsing}>
      <form action="#" className={bS.passToggle}>
        <input type="checkbox" name="pass-safe-browsing" id="pass-safe-browsing" defaultChecked={sbr} onChange={handleChange} disabled={disabled ? 'disabled' : ''} />
        <label htmlFor="pass-safe-browsing">
          <span className={bS.passToggleBox}>
            <span className={bS.passToggleBoxCircle}></span>
          </span>
  
          <span className={bS.passToggleText}>
            <span>{browser.i18n.getMessage('settings_safe_browsing_reports')}</span>
          </span>
        </label>
      </form>
    </div>
  );
}

export default SafeBrowsingReports;
