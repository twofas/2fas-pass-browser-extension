// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/Search.module.scss';
import { useMemo, memo } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';
import { useSearchFilter } from './hooks/useSearchFilter';
import SearchIcon from '@/assets/popup-window/search-icon.svg?react';
import ClearIcon from '@/assets/popup-window/clear.svg?react';

/**
* Search input component with clear button for filtering items.
* @param {Object} props - The component props.
* @param {Array} props.tagsWithFilteredAmounts - Tags array with filtered amounts.
* @param {number} props.filteredItemsByModelLength - Number of items filtered by model.
* @return {JSX.Element} The rendered search component.
*/
function Search ({ tagsWithFilteredAmounts, filteredItemsByModelLength }) {
  const { getMessage } = useI18n();
  const { data } = usePopupState();
  const { handleSearchChange, clearSearch } = useSearchFilter();

  const placeholder = useMemo(() => {
    let amount;

    if (data?.selectedTag) {
      const tagWithFilteredAmount = tagsWithFilteredAmounts.find(t => t.id === data.selectedTag.id);
      amount = tagWithFilteredAmount?.amount || 0;
    } else {
      amount = filteredItemsByModelLength || 0;
    }

    return getMessage('search_placeholder').replace('%AMOUNT%', amount);
  }, [data?.selectedTag, filteredItemsByModelLength, tagsWithFilteredAmounts]);

  const containerClass = useMemo(() => {
    return `${S.search} ${data?.searchActive ? S.active : ''}`;
  }, [data?.searchActive]);

  const inputClass = useMemo(() => {
    return data?.searchValue && data?.searchValue.length > 0 ? S.withValue : '';
  }, [data?.searchValue]);

  const clearButtonClass = useMemo(() => {
    const isHidden = !data?.searchValue || data?.searchValue?.length <= 0;

    return `${S.searchClear} ${isHidden ? S.hidden : ''}`;
  }, [data?.searchValue]);

  return (
    <div className={containerClass}>
      <SearchIcon />
      <input
        id="search"
        name="search"
        type="search"
        placeholder={placeholder}
        dir="ltr"
        spellCheck="false"
        autoCorrect="off"
        autoComplete="off"
        autoCapitalize="off"
        maxLength="2048"
        onChange={handleSearchChange}
        value={data?.searchValue || ''}
        className={inputClass}
      />

      <button className={clearButtonClass} onClick={clearSearch}>
        <ClearIcon />
      </button>
    </div>
  );
}

export default memo(Search);
