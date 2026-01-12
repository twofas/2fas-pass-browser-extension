// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback } from 'react';
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';

/**
* Hook for managing tag filter selection in popup state.
* @return {Object} Object containing handleTagChange and clearTagFilter callback functions.
*/
export const useTagFilter = () => {
  const { setData, setBatchData } = usePopupState();

  const handleTagChange = useCallback(tag => {
    if (tag) {
      const tagInfo = { name: tag.name, amount: tag.amount };
      setBatchData({ selectedTag: tag, lastSelectedTagInfo: tagInfo });
    } else {
      setData('selectedTag', null);
    }
  }, [setBatchData, setData]);

  const clearTagFilter = useCallback(() => {
    setData('selectedTag', null);
  }, [setData]);

  return { handleTagChange, clearTagFilter };
};
