// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback } from 'react';
import usePopupStateStore from '@/entrypoints/popup/store/popupState';

/**
* Hook for managing sort selection in popup state.
* @return {Object} Object containing handleSortChange callback function.
*/
export const useSortFilter = () => {
  const setData = usePopupStateStore(state => state.setData);

  const handleSortChange = useCallback(newSort => {
    setData('selectedSort', newSort);
  }, [setData]);

  return { handleSortChange };
};
