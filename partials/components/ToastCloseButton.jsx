// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, lazy } from 'react';

const BtnIcon = lazy(() => import('@/assets/popup-window/toast-btn.svg?react'));

/** 
* Renders a close button for the toast notification.
* @param {Object} props - The component props.
* @param {Function} props.closeToast - The function to call when the button is clicked.
* @return {JSX.Element} The rendered button element.
*/
function ToastCloseButton ({ closeToast }) {
  const btnRef = useRef(null);

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      btnRef.current.classList.add('active');
    }, 100);

    return () => {
      clearTimeout(timeoutID);
    };
  }, []);

  return (
    <button className='Toastify__toast-close' onClick={closeToast} ref={btnRef} title={getMessage('close')}>
      <BtnIcon />
    </button>
  );
};

export default ToastCloseButton;
