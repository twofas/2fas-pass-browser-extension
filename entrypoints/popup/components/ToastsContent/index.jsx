// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { ToastContainer, Slide } from 'react-toastify';
import { lazy } from 'react';
import ToastCloseButton from '@/partials/components/ToastCloseButton';

const SuccessIcon = lazy(() => import('@/assets/popup-window/toast-success.svg?react'));
const InfoIcon = lazy(() => import('@/assets/popup-window/toast-info.svg?react'));
const WarningIcon = lazy(() => import('@/assets/popup-window/toast-warning.svg?react'));
const ErrorIcon = lazy(() => import('@/assets/popup-window/toast-error.svg?react'));

/** 
* Function component for the ToastsContent.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered component.
*/
function ToastsContent (props) {
  return (
    <ToastContainer
      className={`Toastify__2fas_pass ${props.className || ''}`}
      position="bottom-center"
      autoClose={config.toastAutoClose}
      hideProgressBar={true}
      rtl={false}
      draggable={false}
      transition={Slide}
      closeButton={ToastCloseButton}
      stacked
      icon={({ type }) => {
        switch (type) {
          case 'info': return <InfoIcon />;
          case 'error': return <ErrorIcon />;
          case 'success': return <SuccessIcon />;
          case 'warning': return <WarningIcon />;
          default: return null;
        }
      }}
    />
  );
};

export default ToastsContent;
