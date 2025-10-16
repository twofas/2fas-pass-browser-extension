// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../ThisTab.module.scss';
import Item from '../components/Item';
import { ViewportList } from 'react-viewport-list';
import { lazy } from 'react';
import sortByName from '@/partials/functions/sortByName';
import isItemsCorrect from './isItemsCorrect';

const EmptyListIcon = lazy(() => import('@/assets/popup-window/empty-list.svg?react'));

/** 
* Function to generate a list of all items.
* @param {Array} items - The array of items.
* @param {string} sort - The sorting criteria.
* @param {string} search - The search query.
* @param {boolean} loading - Indicates if the items are still loading.
* @param {Object|null} selectedTag - The selected tag object to filter by.
* @return {JSX.Element|null} The generated item list or null.
*/
const generateAllItemsList = (items, sort, search, loading, tags, selectedTag) => {
  if (!isItemsCorrect(items) && !loading) {
    return null;
  }

  if (!isItemsCorrect(items) && loading) {
    const itemsEmpty = [];

    for (let i = 0; i < 3; i++) {
      itemsEmpty.push({ id: i, item: [] });
    }

    return (
      <div className={S.thisTabAllLoginsList}>
        <ViewportList items={itemsEmpty}>
          {item => <Item data={item} key={item.id} loading={loading} />}
        </ViewportList>
      </div>
    );
  }

  let itemsData;

  let fetchedItems = items.filter(item => item.securityType === SECURITY_TIER.HIGHLY_SECRET && item.sifExists);
  let restItems = items.filter(item => item.securityType !== SECURITY_TIER.HIGHLY_SECRET || (item.securityType === SECURITY_TIER.HIGHLY_SECRET && !item.sifExists));

  fetchedItems = sortByName(fetchedItems, sort);
  restItems = sortByName(restItems, sort);

  itemsData = fetchedItems.concat(restItems);

  if (selectedTag) {
    itemsData = itemsData.filter(item => {
      if (!item?.tags || !Array.isArray(item?.tags)) {
        return false;
      }
      
      const tagsSet = new Set(item.tags);
      return tagsSet.has(selectedTag.id);
    });
  }

  if (search && search.length > 0) {
    itemsData = itemsData.filter(item => {
      const urisTexts = item.content.uris.map(uri => uri.text);
      
      let tagNamesMatch = false;
      if (item?.tags && Array.isArray(item?.tags) && tags && Array.isArray(tags)) {
        tagNamesMatch = item.tags.some(tagId => {
          const tag = tags.find(t => t.id === tagId);
          return tag?.name?.toLowerCase().includes(search?.toLowerCase());
        });
      }

      return item?.content?.name?.toLowerCase().includes(search?.toLowerCase()) ||
        item?.content?.username?.toLowerCase().includes(search?.toLowerCase()) ||
          urisTexts.some(uriText => uriText?.toLowerCase().includes(search?.toLowerCase())) ||
        tagNamesMatch;
    });
  }

  if ((!itemsData || itemsData.length <= 0) && !loading) {
    return (
      <div className={`${S.thisTabAllLoginsList} ${S.noData}`}>
        <div>
          <EmptyListIcon className={S.noDataIcon} />
          <span>{browser.i18n.getMessage('this_tab_no_search_results')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={S.thisTabAllLoginsList}>
      <ViewportList items={itemsData} overscan={5}>
        {item => <Item data={item} key={item.id} />}
      </ViewportList>
    </div>
  );
};

export default generateAllItemsList;
