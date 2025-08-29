// SPDX-License-Identifier: BUSL-1.1
//
// Copyright � 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './UpdateComponent.module.scss';
import { useCallback, lazy } from 'react';
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
      maxHeight: { duration: 0.3, ease: 'easeInOut' },
      opacity: { duration: 0.2, delay: 0.1 }
    }
  },
  hidden: { 
    maxHeight: 0,
    opacity: 0,
    padding: '0',
    transition: { 
      maxHeight: { duration: 0.3, ease: 'easeInOut', delay: 0.1 },
      opacity: { duration: 0.2 }
    }
  }
};

/** 
* Function to render the update notification component.
* @param {Object} props - Component props
* @param {boolean} props.updateAvailable - Whether an update is available
* @return {JSX.Element} Element representing the UpdateComponent.
*/
function UpdateComponent({ updateAvailable }) {
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