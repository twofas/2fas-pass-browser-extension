// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import LoginItem from '../components/LoginItem';
import { ViewportList } from 'react-viewport-list';
import sortByName from '@/partials/functions/sortByName';
import isLoginsCorrect from './isLoginsCorrect';

/** 
* Function to generate a list of matching logins.
* @param {Array} logins - The array of login items.
* @param {boolean} loading - Indicates if the logins are still loading.
* @return {JSX.Element|null} The generated login items or null.
*/
const generateMatchingLoginsList = (logins, loading) => {
  if (!isLoginsCorrect(logins) && !loading) {
    return null;
  }

  if (!isLoginsCorrect(logins) && loading) {
    let logins = [{ id: 0, login: [] }];

    return (
      <ViewportList items={logins}>
        {login => <LoginItem login={login} key={login.id} loading={loading} />}
      </ViewportList>
    );
  }

  let loginsData;

  let fetchedLogins = logins.filter(login => login.securityType === 1 && login.password && login.password.length > 0);
  let restLogins = logins.filter(login => login.securityType !== 1 || (login.securityType === 1 && !login.password));

  fetchedLogins = sortByName(fetchedLogins);
  restLogins = sortByName(restLogins);

  loginsData = fetchedLogins.concat(restLogins);

  return (
    <ViewportList items={loginsData} overscan={2}>
      {login => <LoginItem login={login} key={login.id} />}
    </ViewportList>
  );
};

export default generateMatchingLoginsList;
