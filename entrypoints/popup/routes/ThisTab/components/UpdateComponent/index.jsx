// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './UpdateComponent.module.scss';
import { useCallback, useState, useEffect, lazy } from 'react';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';

const RefreshIcon = lazy(() => import('@/assets/popup-window/refresh.svg?react'));
const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

const updateBarVariants = {
  visible: {
    maxHeight: '60px',
    opacity: 1,
    padding: '8px',
    transition: {
      maxHeight: { duration: 0.2, ease: 'easeOut' },
      opacity: { duration: 0.1, delay: 0.1 }
    }
  },
  hidden: {
    maxHeight: 0,
    opacity: 0,
    padding: '0',
    transition: {
      maxHeight: { duration: 0.2, ease: 'easeOut', delay: 0.1 },
      opacity: { duration: 0.1 }
    }
  }
};

/**
* Component displaying update notification when extension update is available.
* @return {JSX.Element} Element representing the UpdateComponent.
*/
function UpdateComponent () {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const handleUpdate = useCallback(async () => {
    try {
      if (browser?.runtime?.reload) {
        await browser.runtime.reload();
      } else if (browser?.runtime?.restart) {
        await browser.runtime.restart();
      } else {
        showToast(browser.i18n.getMessage('this_tab_update_manual_required'), 'error');
      }
    } catch (e) {
      await CatchError(e);
    }
  }, []);

  const messageListener = useCallback((request, sender, sendResponse) => {
    if (!request || !request?.action || request?.target !== REQUEST_TARGETS.POPUP_THIS_TAB) {
      return false;
    }

    if (request.action === REQUEST_ACTIONS.UPDATE_AVAILABLE) {
      setUpdateAvailable(true);
      sendResponse({ status: 'ok' });
      return true;
    }

    return false;
  }, []);

  useEffect(() => {
    browser.runtime.onMessage.addListener(messageListener);

    if (browser?.runtime?.requestUpdateCheck && typeof browser?.runtime?.requestUpdateCheck === 'function') {
      browser.runtime.requestUpdateCheck()
        .then(([status]) => {
          if (status === 'update_available') {
            setUpdateAvailable(true);
          }
        })
        .catch(() => {});
    }

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, [messageListener]);

  return (
    <LazyMotion features={loadDomAnimation}>
      <m.div
        className={S.updateContainer}
        variants={updateBarVariants}
        initial='hidden'
        animate={updateAvailable ? 'visible' : 'hidden'}
      >
        <div className={S.updateContainerBox}>
          <div className={S.updateContainerBoxContent}>
            <span className={S.updateContainerBoxText}>
              {browser.i18n.getMessage('this_tab_update_available')}
            </span>
          </div>
          <button 
            className={S.updateContainerBoxButton}
            onClick={handleUpdate}
            title={browser.i18n.getMessage('this_tab_update_button_title')}
          >
            <RefreshIcon />
            {browser.i18n.getMessage('this_tab_update_button')}
          </button>
        </div>
      </m.div>
    </LazyMotion>
  );
}

export default UpdateComponent;