// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/TagsInfo.module.scss';
import { useMemo, memo } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';
import { useTagFilter } from '../Filters/hooks/useTagFilter';
import ClearIcon from '@/assets/popup-window/clear.svg?react';

/**
* Component displaying active tag filter info with clear button.
* @param {Object} props - The component props.
* @param {Array} props.tagsWithFilteredAmounts - Tags array with filtered amounts.
* @param {number} props.filteredItemsCount - Number of items matching the filter.
* @return {JSX.Element} The rendered tag info component.
*/
function TagsInfo ({ tagsWithFilteredAmounts, filteredItemsCount }) {
  const { getMessage } = useI18n();
  const { data } = usePopupState();
  const { clearTagFilter } = useTagFilter();

  const currentTagInfo = useMemo(() => {
    if (!data?.selectedTag || !data?.lastSelectedTagInfo) {
      return null;
    }

    const tagWithFilteredAmount = tagsWithFilteredAmounts.find(t => t.id === data.selectedTag.id);

    return {
      name: data.lastSelectedTagInfo.name,
      amount: tagWithFilteredAmount?.amount || 0
    };
  }, [data?.selectedTag, data?.lastSelectedTagInfo, tagsWithFilteredAmounts]);

  const isActive = currentTagInfo && data?.selectedTag;

  const containerClass = useMemo(() => {
    return `${S.tagsInfo} ${isActive ? S.active : ''}`;
  }, [isActive]);

  const infoText = useMemo(() => {
    return getMessage('tags_info_text')
      .replace('AMOUNT', filteredItemsCount)
      .replace('TAG_NAME', currentTagInfo?.name || '');
  }, [filteredItemsCount, currentTagInfo?.name]);

  const clearButtonTitle = useMemo(() => {
    return getMessage('tags_info_clear_filter');
  }, []);

  return (
    <div className={containerClass}>
      <div className={S.tagsInfoBox} title={infoText}>
        <p>{infoText}</p>
        <button onClick={clearTagFilter} title={clearButtonTitle}>
          <ClearIcon />
        </button>
      </div>
    </div>
  );
}

export default memo(TagsInfo);
