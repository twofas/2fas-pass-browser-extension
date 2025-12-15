// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ErrorFallback.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import ToastsContent from '../../components/ToastsContent';
import usePopupStateStore from '../../store/popupState';

/**
* Function to render the Not Found component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function ErrorFallback (props) {
  const clearAllData = usePopupStateStore(state => state.clearAllData);

  const handleRetry = () => {
    clearAllData();
    window.location.reload();
  };

  const handleCopyErrorMessage = () => {
    if (props?.error?.message) {
      try {
        navigator.clipboard.writeText(props.error.message);
        showToast(browser.i18n.getMessage('notification_error_message_copied'), 'success');
      } catch {
        showToast(browser.i18n.getMessage('error_error_message_copy_failed'), 'error');
      }
    }
  };

  return (
    <>
      <div className={`${props.className ? props.className : ''}`}>
        <div className={S.errorFallbackContainer}>
          <section className={S.errorFallback}>
            <div className={S.errorFallbackInfo}>
              <h1>{browser.i18n.getMessage('error_fallback_header')}</h1>
              <p>{browser.i18n.getMessage('error_fallback_description')}</p>

              <button
                className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction} ${bS.btnErrorFallback}`}
                onClick={handleRetry}
              >
                {browser.i18n.getMessage('error_fallback_retry_button')}
              </button>
            </div>

            <div className={S.errorFallbackDetails} title={props?.error?.message}>
              <pre>{props?.error?.message}</pre>
              <button
                className={S.errorFallbackDetailsCopyButton}
                title={browser.i18n.getMessage('error_fallback_copy_error_title')}
                onClick={handleCopyErrorMessage}
                tabIndex={-1}
              >
                <CopyIcon />
              </button>
            </div>
          </section>
        </div>
      </div>

      <ToastsContent />
    </>
  );
}

export default ErrorFallback;
