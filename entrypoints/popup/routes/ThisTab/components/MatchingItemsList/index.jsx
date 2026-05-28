// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Item from '../Item';
import SafariViewportList from '@/entrypoints/popup/components/SafariViewportList';
import isItemsCorrect from '../../functions/isItemsCorrect';
import getBestMatcherForItem from '../../functions/getBestMatcherForItem';
import { useMemo, memo, useCallback } from 'react';

/**
* Component displaying a list of matching items for the current domain.
* Items are sorted by URIMatcher score (desc); name (asc) is used only as a tiebreaker.
* @param {Object} props - The component props.
* @param {Array} props.items - The array of matching items.
* @param {string} props.url - The current tab URL, used for matcher-aware sorting.
* @param {boolean} props.loading - Indicates if the items are still loading.
* @return {JSX.Element|null} The rendered matching items list or null.
*/
function MatchingItemsList ({ items, url, loading }) {
  const renderItem = useCallback(item => <Item data={item} key={item.id} />, []);

  const itemsData = useMemo(() => {
    if (!isItemsCorrect(items) && loading) {
      return { type: 'loading', data: null };
    }

    if (!isItemsCorrect(items) && !loading) {
      return null;
    }

    const fetchedItems = items.filter(item => item.securityType === SECURITY_TIER.HIGHLY_SECRET && item.sifExists);
    const restItems = items.filter(item => item.securityType !== SECURITY_TIER.HIGHLY_SECRET || (item.securityType === SECURITY_TIER.HIGHLY_SECRET && !item.sifExists));

    const matcherByItem = new WeakMap();

    for (const item of items) {
      matcherByItem.set(item, getBestMatcherForItem(item, url));
    }

    const compareByMatcherThenName = (a, b) => {
      const matcherDiff = matcherByItem.get(b) - matcherByItem.get(a);

      if (matcherDiff !== 0) {
        return matcherDiff;
      }

      const nameA = a?.content?.name?.toLowerCase() || '';
      const nameB = b?.content?.name?.toLowerCase() || '';

      if (nameA < nameB) {
        return -1;
      }

      if (nameA > nameB) {
        return 1;
      }

      return 0;
    };

    fetchedItems.sort(compareByMatcherThenName);
    restItems.sort(compareByMatcherThenName);

    const result = fetchedItems.concat(restItems);

    return { type: 'data', data: result };
  }, [items, loading, url]);

  if (itemsData === null) {
    return null;
  }

  if (itemsData.type === 'loading') {
    return <div style={{ height: '86px' }} />;
  }

  return (
    <SafariViewportList items={itemsData.data}>
      {renderItem}
    </SafariViewportList>
  );
}

export default memo(MatchingItemsList);
