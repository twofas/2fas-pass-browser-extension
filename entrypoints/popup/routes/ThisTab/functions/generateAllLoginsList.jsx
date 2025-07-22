// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../ThisTab.module.scss';
import LoginItem from '../components/LoginItem';
import { ViewportList } from 'react-viewport-list';
import { lazy } from 'react';
import sortByName from '@/partials/functions/sortByName';
import isLoginsCorrect from './isLoginsCorrect';

const EmptyListIcon = lazy(() => import('@/assets/popup-window/empty-list.svg?react'));

/** 
* Function to generate a list of all logins.
* @param {Array} logins - The array of login items.
* @param {string} sort - The sorting criteria.
* @param {string} search - The search query.
* @param {boolean} loading - Indicates if the logins are still loading.
* @return {JSX.Element|null} The generated login items or null.
*/
const generateAllLoginsList = (logins, sort, search, loading) => {
  if (!isLoginsCorrect(logins) && !loading) {
    return null;
  }

  if (!isLoginsCorrect(logins) && loading) {
    const logins = [];

    for (let i = 0; i < 3; i++) {
      logins.push({
        id: i,
        login: []
      });
    }

    return (
      <div className={S.thisTabAllLoginsList}>
        <ViewportList items={logins}>
          {login => <LoginItem login={login} key={login.id} loading={loading} />}
        </ViewportList>
      </div>
    );
  }

  let loginsData;

  let fetchedLogins = logins.filter(login => login.securityType === SECURITY_TIER.HIGHLY_SECRET && login.password && login.password.length > 0);
  let restLogins = logins.filter(login => login.securityType !== SECURITY_TIER.HIGHLY_SECRET || (login.securityType === SECURITY_TIER.HIGHLY_SECRET && !login.password));

  fetchedLogins = sortByName(fetchedLogins, sort);
  restLogins = sortByName(restLogins, sort);

  loginsData = fetchedLogins.concat(restLogins);

  if (search && search.length > 0) {
    loginsData = loginsData.filter(login => {
      const urisTexts = login.uris.map(uri => uri.text);

      return login?.name?.toLowerCase().includes(search?.toLowerCase()) ||
        login?.username?.toLowerCase().includes(search?.toLowerCase()) ||
        urisTexts.some(uriText => uriText?.toLowerCase().includes(search?.toLowerCase()));
    });
  }

  if ((!loginsData || loginsData.length <= 0) && !loading) {
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
      <ViewportList items={loginsData} overscan={5}>
        {login => <LoginItem login={login} key={login.id} />}
      </ViewportList>
    </div>
  );
};

export default generateAllLoginsList;
