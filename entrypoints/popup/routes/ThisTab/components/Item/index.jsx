// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/Item.module.scss';

import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useIsItemOpen, useItemMenuActions } from '../../context/ItemListContext';

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
  const itemId = props.data?.id;
  const more = useIsItemOpen(itemId);
  const { openMenu, closeMenu } = useItemMenuActions();

  const ref = useRef(null);
  const selectRef = useRef(null);
  const autofillBtnRef = useRef(null);
  const isHoveredRef = useRef(false);
  const itemIdRef = useRef(itemId);
  itemIdRef.current = itemId;

  const setMore = useCallback(value => {
    if (value) {
      openMenu(itemIdRef.current);
    } else {
      closeMenu();
    }
  }, [openMenu, closeMenu]);

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
    `${S.item} ${more ? S.hover : ''} ${props.loading === true ? S.loading : ''}`,
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

  if (constructorName === 'Login' || props.loading) {
    modelComponent = (
      <LoginItemView
        data={props.data}
        more={more}
        setMore={setMore}
        selectRef={selectRef}
        autofillBtnRef={autofillBtnRef}
        loading={props.loading}
      />
    );
  } else if (constructorName === 'SecureNote') {
    modelComponent = (
      <SecureNoteItemView
        data={props.data}
        more={more}
        setMore={setMore}
        selectRef={selectRef}
        autofillBtnRef={autofillBtnRef}
        loading={props.loading}
      />
    );
  } else if (constructorName === 'PaymentCard') {
    modelComponent = (
      <PaymentCardItemView
        data={props.data}
        more={more}
        setMore={setMore}
        selectRef={selectRef}
        autofillBtnRef={autofillBtnRef}
        loading={props.loading}
      />
    );
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

/**
* Custom comparison function to prevent unnecessary re-renders.
* Only re-render if data id or loading state changes.
* @param {Object} prevProps - Previous props.
* @param {Object} nextProps - Next props.
* @return {boolean} True if props are equal (should not re-render).
*/
function arePropsEqual (prevProps, nextProps) {
  return prevProps.data?.id === nextProps.data?.id &&
         prevProps.loading === nextProps.loading;
}

export default memo(Item, arePropsEqual);
