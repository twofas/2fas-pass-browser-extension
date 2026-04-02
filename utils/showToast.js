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
* @param {Object} [options] - Additional options for the toast.
* @param {string} [options.toastId] - Unique ID to prevent duplicate toasts.
* @return {string} The ID of the toast notification.
*/
const showToast = (message, type = 'info', autoClose, options = {}) => {
  if (!isText(message)) {
    throw new TwoFasError(TwoFasError.errors.toastMessageNotString, { additional: { func: 'showToast', message } });
  }

  if (options.toastId && toast.isActive(options.toastId)) {
    return options.toastId;
  }

  const toastId = toast(
    message,
    {
      type,
      autoClose,
      closeButton: autoClose === false ? false : true,
      ...(options.toastId ? { toastId: options.toastId } : {})
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
