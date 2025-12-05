// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';

import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useItemList } from '../../context/ItemListContext';

// Models
import LoginItemView from './modelsViews/LoginItemView';
import SecureNoteItemView from './modelsViews/SecureNoteItemView';
import PaymentCardItemView from './modelsViews/PaymentCardItemView';

/**
* Function to render the item.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Item (props) {
  const { openItemId, openMenu, closeMenu } = useItemList();

  const ref = useRef(null);
  const selectRef = useRef(null);
  const autofillBtnRef = useRef(null);
  const isHoveredRef = useRef(false);

  const itemId = props.data?.id;
  const more = openItemId === itemId;

  const setMore = useCallback(value => {
    if (value) {
      openMenu(itemId);
    } else {
      closeMenu();
    }
  }, [itemId, openMenu, closeMenu]);

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;

    if (ref.current && !ref.current.classList.contains(S.hover)) {
      ref.current.classList.add(S.hover);
    }

    if (autofillBtnRef.current && !autofillBtnRef.current.classList.contains(S.hover)) {
      autofillBtnRef.current.classList.add(S.hover);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;

    if (!more) {
      if (ref.current) {
        ref.current.classList.remove(S.hover);
      }

      if (autofillBtnRef.current) {
        autofillBtnRef.current.classList.remove(S.hover);
      }
    }
  }, [more]);

  const itemClassName = useMemo(() =>
    `${S.servicesListItem} ${more ? S.hover : ''} ${props.loading === true ? S.loading : ''}`,
    [more, props.loading]
  );

  useEffect(() => {
    if (!more && !isHoveredRef.current) {
      if (ref.current) {
        ref.current.classList.remove(S.hover);
      }

      if (autofillBtnRef.current) {
        autofillBtnRef.current.classList.remove(S.hover);
      }
    }
  }, [more]);

  if (!props.data) {
    return null;
  }

  const constructorName = props?.data?.constructor?.name;
  let modelComponent = null;

  const modelData = {
    more,
    setMore,
    selectRef,
    ref,
    autofillBtnRef,
    loading: props.loading
  };

  if (constructorName === 'Login' || props.loading) {
    modelComponent = <LoginItemView {...props} {...modelData} />;
  } else if (constructorName === 'SecureNote') {
    modelComponent = <SecureNoteItemView {...props} {...modelData} />;
  } else if (constructorName === 'PaymentCard') {
    modelComponent = <PaymentCardItemView {...props} {...modelData} />;
  } else {
    return null;
  }

  return (
    <div
      key={props.data.id}
      className={itemClassName}
      ref={ref}
      data-item-id={itemId}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {modelComponent}
    </div>
  );
}

export default memo(Item);
