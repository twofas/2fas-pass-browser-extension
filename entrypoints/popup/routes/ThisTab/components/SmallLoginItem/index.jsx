// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import PasswordCopyOnlyBtn from '../../functions/serviceList/additionalButtons/PasswordCopyOnlyBtn';
import generateIcon from '../../functions/serviceList/generateIcon';
import { useState, useEffect, useRef } from 'react';
import getServices from '@/partials/sessionStorage/getServices';

/** 
* Function to render a small login item.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SmallLoginItem (props) {
  const [faviconError, setFaviconError] = useState(false);
  const [login, setLogin] = useState(null);
  const ref = useRef(null);

  const getLogin = async () => {
    if (!props?.itemId) {
      return false;
    }

    const logins = await getServices();
    const login = logins.filter(l => l.id === props.itemId)[0];

    setLogin(login);
  };

  useEffect(() => {
    getLogin();
  }, []);

  if (!login) {
    return null;
  }

  return (
    <div
      key={login.id}
      className={`${S.servicesListItem} ${S.small}`}
      ref={ref}
    >
      <div className={S.servicesListItemAutofill}>
        {generateIcon(login, faviconError, setFaviconError)}
        <span>
          <span>{login.name || browser.i18n.getMessage('no_item_name')}</span>
          <span>{login.username || ''}</span>
        </span>
      </div>
      <div className={S.servicesListItemAdditionalButtons}>
        <PasswordCopyOnlyBtn state={props.state} setAutofillFailed={props.setAutofillFailed} />
      </div>
    </div>
  );
}

export default SmallLoginItem;
