// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback } from 'react';
import { toast } from 'react-toastify';
import keepPassword from '../functions/keepPassword';

/**
* Hook for managing keep password popup actions.
* @param {Object} state - The location state containing password data.
* @param {Function} setAutofillFailed - Function to set autofill failed state.
* @return {Object} Object containing handleKeepPassword and handleDontKeepPassword callback functions.
*/
export const useKeepPassword = (state, setAutofillFailed) => {
  const handleKeepPassword = useCallback(async () => {
    await keepPassword(state);
    window.history.replaceState({}, '');
    setAutofillFailed(false);

    if (state?.toastId) {
      toast.dismiss(state?.toastId);
    }
  }, [state, setAutofillFailed]);

  const handleDontKeepPassword = useCallback(() => {
    setAutofillFailed(false);
    window.history.replaceState({}, '');

    if (state?.toastId) {
      toast.dismiss(state?.toastId);
    }
  }, [state, setAutofillFailed]);

  return { handleKeepPassword, handleDontKeepPassword };
};
