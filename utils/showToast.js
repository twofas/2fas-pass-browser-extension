// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { toast } from 'react-toastify';
import isText from '@/partials/functions/isText';

/** 
* Displays a toast notification.
* @param {string} message - The message to display in the toast.
* @param {string} [type='info'] - The type of toast (e.g., 'success', 'error').
* @param {number|boolean} [autoClose] - The duration in milliseconds before the toast closes automatically, or false to disable auto-close.
* @return {string} The ID of the toast notification.
*/
const showToast = (message, type = 'info', autoClose) => {
  if (!isText(message)) {
    throw new TwoFasError(TwoFasError.errors.toastMessageNotString, { additional: { func: 'showToast', message } });
  }

  const toastId = toast(
    message,
    {
      type,
      autoClose,
      closeButton: autoClose === false ? false : true
    }
  );

  if (autoClose === false) {
    return toastId;
  }

  if (!Number.isInteger(autoClose)) {
    autoClose = config.toastAutoClose;
  }

  setTimeout(() => {
    toast.dismiss(toastId);
  }, autoClose);

  return toastId;
};

export default showToast;
