// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback } from 'react';
import usePopupStateStore from '@/entrypoints/popup/store/popupState';

/**
* Hook for managing search filter state in popup.
* @return {Object} Object containing handleSearchChange and clearSearch callback functions.
*/
export const useSearchFilter = () => {
  const setBatchData = usePopupStateStore(state => state.setBatchData);

  const handleSearchChange = useCallback(e => {
    const value = e?.target?.value;

    if (value.trim().length > 0) {
      setBatchData({ searchActive: true, searchValue: value });
    } else {
      setBatchData({ searchActive: false, searchValue: '' });
    }
  }, [setBatchData]);

  const clearSearch = useCallback(() => {
    setBatchData({ searchValue: '', searchActive: false });
  }, [setBatchData]);

  return { handleSearchChange, clearSearch };
};
