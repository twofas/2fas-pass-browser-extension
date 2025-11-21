// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import LoginItem from '../components/Item';
import SafariViewportList from '@/entrypoints/popup/components/SafariViewportList';
import sortByName from '@/partials/functions/sortFunction';
import isItemsCorrect from './isItemsCorrect';

/** 
* Function to generate a list of matching logins.
* @param {Array} logins - The array of login items.
* @param {boolean} loading - Indicates if the logins are still loading.
* @return {JSX.Element|null} The generated login items or null.
*/
const generateMatchingItemsList = (items, loading) => {
  if (!isItemsCorrect(items) && !loading) {
    return null;
  }

  if (!isItemsCorrect(items) && loading) {
    const itemsEmpty = [{ id: 0, item: [] }];

    return (
      <SafariViewportList items={itemsEmpty} overscan={2}>
        {item => <LoginItem item={item} key={item.id} loading={loading} />}
      </SafariViewportList>
    );
  }

  let fetchedLogins = items.filter(item => item.securityType === SECURITY_TIER.HIGHLY_SECRET && item.sifExists);
  let restLogins = items.filter(item => item.securityType !== SECURITY_TIER.HIGHLY_SECRET || (item.securityType === SECURITY_TIER.HIGHLY_SECRET && !item.sifExists));

  fetchedLogins = sortByName(fetchedLogins);
  restLogins = sortByName(restLogins);

  const itemsData = fetchedLogins.concat(restLogins);

  return (
    <SafariViewportList items={itemsData} overscan={5}>
      {item => <LoginItem data={item} key={item.id} />}
    </SafariViewportList>
  );
};

export default generateMatchingItemsList;
