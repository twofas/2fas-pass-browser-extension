// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import { useMemo, memo } from 'react';
import { useTagFilter } from '../Filters/hooks/useTagFilter';
import ClearIcon from '@/assets/popup-window/clear.svg?react';

/**
* Component displaying active tag filter info with clear button.
* @param {Object} props - The component props.
* @param {Object} props.currentTagInfo - Object with tag name and filtered amount.
* @param {boolean} props.isActive - Whether a tag filter is currently active.
* @param {number} props.filteredItemsCount - Number of items matching the filter.
* @return {JSX.Element} The rendered tag info component.
*/
function TagsInfo ({ currentTagInfo, isActive, filteredItemsCount }) {
  const { clearTagFilter } = useTagFilter();

  const containerClass = useMemo(() => {
    return `${S.thisTabAllLoginsTagsInfo} ${isActive ? S.active : ''}`;
  }, [isActive]);

  const infoText = useMemo(() => {
    return browser.i18n.getMessage('this_tab_tag_info_text')
      .replace('AMOUNT', filteredItemsCount)
      .replace('TAG_NAME', currentTagInfo?.name || '');
  }, [filteredItemsCount, currentTagInfo?.name]);

  const clearButtonTitle = useMemo(() => {
    return browser.i18n.getMessage('this_tab_clear_tag_filter');
  }, []);

  return (
    <div className={containerClass}>
      <div className={S.thisTabAllLoginsTagsInfoBox} title={infoText}>
        <p>{infoText}</p>
        <button onClick={clearTagFilter} title={clearButtonTitle}>
          <ClearIcon />
        </button>
      </div>
    </div>
  );
}

export default memo(TagsInfo);
