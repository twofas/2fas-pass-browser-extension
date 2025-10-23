// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import PasswordCopyOnlyBtn from '../../functions/serviceList/additionalButtons/PasswordCopyOnlyBtn';
import generateIcon from '../../functions/serviceList/generateIcon';
import { useState, useEffect, useRef } from 'react';
import getItem from '@/partials/sessionStorage/getItem';

/** 
* Function to render a small login item.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SmallLoginItem (props) {
  const [faviconError, setFaviconError] = useState(false);
  const [item, setItem] = useState(null);
  const ref = useRef(null);

  const getItemData = async () => {
    if (!props?.itemId) {
      return false;
    }

    const item = await getItem(props.itemId);
    setItem(item);
  };

  useEffect(() => {
    getItemData();
  }, []);

  if (!item) {
    return null;
  }

  return (
    <div
      key={item.id}
      className={`${S.servicesListItem} ${S.small}`}
      ref={ref}
    >
      <div className={S.servicesListItemAutofill}>
        {generateIcon(item, faviconError, setFaviconError)}
        <span>
          <span>{item?.content?.name || browser.i18n.getMessage('no_item_name')}</span>
          <span>{item?.content?.username || ''}</span>
        </span>
      </div>
      <div className={S.servicesListItemAdditionalButtons}>
        <PasswordCopyOnlyBtn state={props.state} setAutofillFailed={props.setAutofillFailed} />
      </div>
    </div>
  );
}

export default SmallLoginItem;
