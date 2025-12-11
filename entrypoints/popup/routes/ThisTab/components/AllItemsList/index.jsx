// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/AllItemsList.module.scss';
import Item from '../Item';
import SafariViewportList from '@/entrypoints/popup/components/SafariViewportList';
import { lazy, useMemo, memo } from 'react';
import { sortFunction } from '@/partials/functions';
import isItemsCorrect from '../../functions/isItemsCorrect';

const EmptyListIcon = lazy(() => import('@/assets/popup-window/empty-list.svg?react'));

/**
* Component displaying a list of all items with sorting, filtering and search.
* @param {Object} props - The component props.
* @param {Array} props.items - The array of items.
* @param {string} props.sort - The sorting criteria.
* @param {string} props.search - The search query.
* @param {boolean} props.loading - Indicates if the items are still loading.
* @param {Object|null} props.selectedTag - The selected tag object to filter by.
* @param {string|null} props.itemModelFilter - The item model filter to filter by.
* @return {JSX.Element|null} The rendered item list or null.
*/
function AllItemsList ({ items, sort, search, loading, selectedTag, itemModelFilter }) {
  const itemsData = useMemo(() => {
    if (!isItemsCorrect(items) && !loading) {
      return null;
    }

    if (!isItemsCorrect(items) && loading) {
      const itemsEmpty = [];

      for (let i = 0; i < 3; i++) {
        itemsEmpty.push({ id: i, item: [] });
      }

      return { type: 'loading', data: itemsEmpty };
    }

    let fetchedItems = items.filter(item => item?.securityType === SECURITY_TIER.HIGHLY_SECRET && item?.sifExists);
    let restItems = items.filter(item => item?.securityType !== SECURITY_TIER.HIGHLY_SECRET || (item?.securityType === SECURITY_TIER.HIGHLY_SECRET && !item?.sifExists));

    fetchedItems = sortFunction(fetchedItems, sort);
    restItems = sortFunction(restItems, sort);

    let result = fetchedItems.concat(restItems);

    if (selectedTag) {
      result = result.filter(item => {
        if (!item?.tags || !Array.isArray(item?.tags)) {
          return false;
        }

        const tagsSet = new Set(item.tags);
        return tagsSet.has(selectedTag.id);
      });
    }

    if (itemModelFilter) {
      result = result.filter(item => item?.constructor?.name === itemModelFilter);
    }

    if (search && search.length > 0) {
      result = result.filter(item => {
        let urisTexts = [];

        if (item?.content && item?.content?.uris && Array.isArray(item?.content?.uris)) {
          urisTexts = item.content.uris.map(uri => uri?.text).filter(Boolean);
        }

        return item?.content?.name?.toLowerCase().includes(search?.toLowerCase()) ||
          item?.content?.username?.toLowerCase().includes(search?.toLowerCase()) ||
          urisTexts.some(uriText => uriText?.toLowerCase().includes(search?.toLowerCase()));
      });
    }

    if ((!result || result.length <= 0) && !loading) {
      return { type: 'empty', data: null };
    }

    return { type: 'data', data: result };
  }, [items, sort, search, loading, selectedTag, itemModelFilter]);

  if (itemsData === null) {
    return null;
  }

  if (itemsData.type === 'loading') {
    return (
      <div className={S.allItemsList}>
        <SafariViewportList items={itemsData.data} overscan={3}>
          {item => <Item data={item} key={item.id} loading={loading} />}
        </SafariViewportList>
      </div>
    );
  }

  if (itemsData.type === 'empty') {
    return (
      <div className={`${S.allItemsList} ${S.noData}`}>
        <div>
          <EmptyListIcon />
          <span>{browser.i18n.getMessage('all_items_list_no_search_results')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={S.allItemsList}>
      <SafariViewportList items={itemsData.data} overscan={10}>
        {item => <Item data={item} key={item.id} loading={loading} />}
      </SafariViewportList>
    </div>
  );
}

export default memo(AllItemsList);
