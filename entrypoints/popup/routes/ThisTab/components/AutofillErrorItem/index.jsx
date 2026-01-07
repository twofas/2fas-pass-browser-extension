// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/AutofillErrorItem.module.scss';
import generateIcon from '../../functions/serviceList/generateIcon';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import getItem from '@/partials/sessionStorage/getItem';
import AutofillErrorItemData from './components/AutofillErrorItemData';

/**
* Function to render an autofill error item.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AutofillErrorItem (props) {
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
      className={S.autofillErrorItem}
      ref={ref}
    >
      <div className={S.autofillErrorItemContent}>
        <div className={S.autofillErrorItemContentHeader}>
          {generateIcon(item, faviconError, setFaviconError)}
          <p>{item?.content?.name || browser.i18n.getMessage('no_item_name')}</p>
        </div>
        <AutofillErrorItemData item={item} />
      </div>
    </div>
  );
}

export default memo(AutofillErrorItem);
