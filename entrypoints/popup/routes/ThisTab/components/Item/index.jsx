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
import WifiItemView from './modelsViews/WifiItemView';

const MODEL_COMPONENTS = {
  login: LoginItemView,
  secureNote: SecureNoteItemView,
  paymentCard: PaymentCardItemView,
  wifi: WifiItemView
};

function Item (props) {
  const itemId = props.data?.id;
  const more = useIsItemOpen(itemId);
  const { openMenu, closeMenu } = useItemMenuActions();

  const ref = useRef(null);
  const selectRef = useRef(null);
  const autofillBtnRef = useRef(null);
  const isHoveredRef = useRef(false);
  const itemIdRef = useRef(itemId);
  const moreRef = useRef(more);
  itemIdRef.current = itemId;
  moreRef.current = more;

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

    if (!moreRef.current) {
      if (ref.current) {
        ref.current.classList.remove(S.hover);
      }

      if (autofillBtnRef.current) {
        autofillBtnRef.current.classList.remove(S.hover);
      }
    }
  }, []);

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

  const ModelComponent = props.loading ? LoginItemView : MODEL_COMPONENTS[props.data.contentType];

  if (!ModelComponent) {
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
      <ModelComponent
        data={props.data}
        more={more}
        setMore={setMore}
        selectRef={selectRef}
        autofillBtnRef={autofillBtnRef}
        loading={props.loading}
      />
    </div>
  );
}

function arePropsEqual (prevProps, nextProps) {
  return prevProps.data?.id === nextProps.data?.id &&
         prevProps.data?.sifExists === nextProps.data?.sifExists &&
         prevProps.loading === nextProps.loading;
}

export default memo(Item, arePropsEqual);
