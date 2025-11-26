// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

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
  const [more, setMoreState] = useState(false);

  const ref = useRef(null);
  const selectRef = useRef(null);
  const autofillBtnRef = useRef(null);
  const isHoveredRef = useRef(false);
  const isClosingRef = useRef(false);
  const moreRef = useRef(false);

  const setMore = useCallback(value => {
    moreRef.current = value;
    setMoreState(value);
  }, []);

  const handleScroll = useCallback(event => {
    if (!more || isClosingRef.current) {
      return;
    }

    const selectMenuListElement = document.querySelector('.react-select-dropdown__menu-list');

    if (selectMenuListElement && (event.target === selectMenuListElement || selectMenuListElement.contains(event.target))) {
      return;
    }

    isClosingRef.current = true;
    setMore(false);
  }, [more]);

  const handleClickOutside = useCallback(event => {
    if (ref.current && ref.current.contains(event.target)) {
      return;
    }

    if (!moreRef.current) {
      return;
    }

    const selectMenu = document.querySelector('.react-select-dropdown__menu');

    if (selectMenu && selectMenu.contains(event.target)) {
      return;
    }

    setMore(false);
  }, []);

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
    if (more) {
      isClosingRef.current = false;
    }

    if (!more && !isHoveredRef.current) {
      if (ref.current) {
        ref.current.classList.remove(S.hover);
      }

      if (autofillBtnRef.current) {
        autofillBtnRef.current.classList.remove(S.hover);
      }
    }
  }, [more]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [handleScroll, handleClickOutside]);

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {modelComponent}
    </div>
  );
}

export default memo(Item);
