// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import LoginItem from '../components/Item';
import { ViewportList } from 'react-viewport-list';
import sortByName from '@/partials/functions/sortByName';
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
      <ViewportList items={itemsEmpty}>
        {item => <LoginItem item={item} key={item.id} loading={loading} />}
      </ViewportList>
    );
  }

  let fetchedLogins = items.filter(item => item.securityType === SECURITY_TIER.HIGHLY_SECRET && item.password && item.password.length > 0);
  let restLogins = items.filter(item => item.securityType !== SECURITY_TIER.HIGHLY_SECRET || (item.securityType === SECURITY_TIER.HIGHLY_SECRET && !item.password));

  fetchedLogins = sortByName(fetchedLogins);
  restLogins = sortByName(restLogins);

  const itemsData = fetchedLogins.concat(restLogins);

  return (
    <ViewportList items={itemsData} overscan={2}>
      {item => <LoginItem data={item} key={item.id} />}
    </ViewportList>
  );
};

export default generateMatchingItemsList;
