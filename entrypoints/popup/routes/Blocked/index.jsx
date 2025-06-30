// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Blocked.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect } from 'react';
import focusPopupWindow from '@/partials/functions/focusPopupWindow';

/** 
* Function to focus the popup window in a separate window.
* @async
* @return {void}
*/
const focusPopupInSeparateWindow = async () => {
  if (window && typeof window?.close === 'function' && import.meta.env.BROWSER !== 'safari') {
    await focusPopupWindow();
    window.close();
  }
};

/** 
* Function to handle the opening of the popup window.
* @async
* @return {void}
*/
const handleOpenPopupButton = async () => {
  const focused = await focusPopupWindow();

  if (!focused) {
    const res = await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.OPEN_POPUP_WINDOW_IN_NEW_WINDOW,
      target: REQUEST_TARGETS.BACKGROUND,
      pathname: '/'
    });

    if (res.status === 'error') {
      showToast(browser.i18n.getMessage('error_feature_wrong_data'), 'error');
    }
  }
};

/** 
* Function component that renders the Blocked page.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered Blocked component.
*/
function Blocked (props) {
  useEffect(() => {
    focusPopupInSeparateWindow();
  }, []);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.blocked}>
          <h1>{browser.i18n.getMessage('blocked_text')}</h1>
          <button
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnQrReload}`}
            onClick={handleOpenPopupButton}
          >
            {browser.i18n.getMessage('blocked_button')}
          </button>
        </section>
      </div>
    </div>
  );
}

export default Blocked;
