// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback } from 'react';
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';

/**
* Hook for managing sort selection in popup state.
* @return {Object} Object containing handleSortChange callback function.
*/
export const useSortFilter = () => {
  const { setData } = usePopupState();

  const handleSortChange = useCallback(newSort => {
    setData('selectedSort', newSort);
  }, [setData]);

  return { handleSortChange };
};
