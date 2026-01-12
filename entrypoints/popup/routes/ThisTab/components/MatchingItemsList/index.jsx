// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Item from '../Item';
import SafariViewportList from '@/entrypoints/popup/components/SafariViewportList';
import sortByName from '@/partials/functions/sortFunction';
import isItemsCorrect from '../../functions/isItemsCorrect';
import { useMemo, memo, useCallback } from 'react';

/**
* Component displaying a list of matching items for the current domain.
* @param {Object} props - The component props.
* @param {Array} props.items - The array of matching items.
* @param {boolean} props.loading - Indicates if the items are still loading.
* @return {JSX.Element|null} The rendered matching items list or null.
*/
function MatchingItemsList ({ items, loading }) {
  const renderItem = useCallback(item => <Item data={item} key={item.id} />, []);

  const itemsData = useMemo(() => {
    if (!isItemsCorrect(items) && loading) {
      return { type: 'loading', data: null };
    }

    if (!isItemsCorrect(items) && !loading) {
      return null;
    }

    let fetchedItems = items.filter(item => item.securityType === SECURITY_TIER.HIGHLY_SECRET && item.sifExists);
    let restItems = items.filter(item => item.securityType !== SECURITY_TIER.HIGHLY_SECRET || (item.securityType === SECURITY_TIER.HIGHLY_SECRET && !item.sifExists));

    fetchedItems = sortByName(fetchedItems);
    restItems = sortByName(restItems);

    const result = fetchedItems.concat(restItems);

    return { type: 'data', data: result };
  }, [items, loading]);

  if (itemsData === null) {
    return null;
  }

  if (itemsData.type === 'loading') {
    return <div style={{ height: '86px' }} />;
  }

  return (
    <SafariViewportList items={itemsData.data} overscan={5}>
      {renderItem}
    </SafariViewportList>
  );
}

export default memo(MatchingItemsList);
