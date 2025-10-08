// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import toggleMenu from './functions/toggleMenu';

// Models
import Login from './models/Login';
import SecureNote from './models/SecureNote';

/** 
* Function to render the item.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Item (props) {
  const [more, setMore] = useState(false);

  const ref = useRef(null);
  const selectRef = useRef(null);
  const autofillBtnRef = useRef(null);
  const isHoveredRef = useRef(false);

  const setMoreFalse = useCallback(() => setMore(false), []);

  const handleClickOutside = useCallback(event => {
    if (ref.current && !ref.current.contains(event.target)) {
      toggleMenu(false, { ref, selectRef }, { setMore });
    }
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
    window.addEventListener('scroll', setMoreFalse, true);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', setMoreFalse, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setMoreFalse, handleClickOutside]);

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
    modelComponent = <Login {...props} {...modelData} />;
  } else if (constructorName === 'SecureNote') {
    modelComponent = <SecureNote {...props} {...modelData} />;
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
