// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/SmallLoginItem.module.scss';
import PasswordCopyOnlyBtn from '../../functions/serviceList/additionalButtons/PasswordCopyOnlyBtn';
import generateIcon from '../../functions/serviceList/generateIcon';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
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

  const getItemData = useCallback(async () => {
    if (!props?.deviceId || !props?.vaultId || !props?.itemId) {
      return false;
    }

    const fetchedItem = await getItem(props.deviceId, props.vaultId, props.itemId);
    setItem(fetchedItem);
  }, [props?.deviceId, props?.vaultId, props?.itemId]);

  useEffect(() => {
    getItemData();
  }, [getItemData]);

  if (!item) {
    return null;
  }

  return (
    <div
      key={item.id}
      className={S.smallLoginItem}
      ref={ref}
    >
      <div className={S.smallLoginItemAutofill}>
        {generateIcon(item, faviconError, setFaviconError)}
        <span>
          <span>{item?.content?.name || browser.i18n.getMessage('no_item_name')}</span>
          <span>{item?.content?.username || ''}</span>
        </span>
      </div>
      <div className={S.smallLoginItemAdditionalButtons}>
        <PasswordCopyOnlyBtn state={props.state} setAutofillFailed={props.setAutofillFailed} />
      </div>
    </div>
  );
}

export default memo(SmallLoginItem);
