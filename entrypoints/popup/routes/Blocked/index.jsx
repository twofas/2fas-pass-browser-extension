// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Blocked.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect } from 'react';
import focusPopupWindow from '@/partials/functions/focusPopupWindow';
import tryWindowClose from '@/partials/browserInfo/tryWindowClose';
import { useI18n } from '@/partials/context/I18nContext';

/**
* Function to focus the popup window in a separate window.
* @async
* @return {void}
*/
const focusPopupInSeparateWindow = async () => {
  await focusPopupWindow();
  tryWindowClose();
};

/**
* Function component that renders the Blocked page.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered Blocked component.
*/
function Blocked (props) {
  const { getMessage } = useI18n();

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
        showToast(getMessage('error_feature_wrong_data'), 'error');
      }
    }

    tryWindowClose();
  };

  useEffect(() => {
    if (import.meta.env.BROWSER !== 'safari') {
      focusPopupInSeparateWindow();
    }
  }, []);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.blocked}>
          <h1>{getMessage('blocked_text')}</h1>
          <button
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnQrReload}`}
            onClick={handleOpenPopupButton}
          >
            {getMessage('blocked_button')}
          </button>
        </section>
      </div>
    </div>
  );
}

export default Blocked;
