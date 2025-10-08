// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import generateIcon from '../../functions/serviceList/generateIcon';
import handleAutofill from '../../functions/serviceList/handleAutofill';
import Select from 'react-select';
import { useState, useEffect, useRef, lazy, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router';
import toggleMenu from './functions/toggleMenu';

const Skeleton = lazy(() => import('../Skeleton'));
const PasswordBtn = lazy(() => import('../../functions/serviceList/additionalButtons/PasswordBtn'));
const MoreBtn = lazy(() => import('../../functions/serviceList/additionalButtons/MoreBtn'));
const UsernameBtn = lazy(() => import('../../functions/serviceList/additionalButtons/UsernameBtn'));
const CustomOption = lazy(() => import('./components/CustomOption'));

/** 
* Function to render the login item.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function LoginItem (props) {
  const [more, setMore] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [additionalButtonsHover, setAdditionalButtonsHover] = useState(false);
  
  const ref = useRef(null);
  const selectRef = useRef(null);
  const autofillBtnRef = useRef(null);
  const dropdownOptions = useMemo(() => props.item.dropdownList, [props.item.dropdownList]);

  const navigate = useNavigate();
  const setMoreFalse = useCallback(() => setMore(false), []);

  const handleClickOutside = useCallback(event => {
    if (ref.current && !ref.current.contains(event.target)) {
      toggleMenu(false, { ref, selectRef }, { setMore });
    }
  }, []);

  const handleAutofillClick = useCallback(async () => {
    await handleAutofill(props.item.id, navigate, more, value => toggleMenu(value, { ref, selectRef }, { setMore }));
  }, [props.item.id, navigate, more]);

  const toggleMenuCallback = useCallback((value) => {
    toggleMenu(value, { ref, selectRef }, { setMore });
  }, []);

  const itemClassName = useMemo(() => 
    `${S.servicesListItem} ${(additionalButtonsHover || more) ? S.hover : ''} ${props.loading === true ? S.loading : ''}`,
    [additionalButtonsHover, more, props.loading]
  );

  const autofillClassName = useMemo(() => 
    `${S.servicesListItemAutofill} ${(additionalButtonsHover || more) ? S.hover : ''}`,
    [additionalButtonsHover, more]
  );

  useEffect(() => {
    if (!autofillBtnRef?.current || !more) {
      if (autofillBtnRef.current && !autofillBtnRef.current.matches(':hover')) {
        setAdditionalButtonsHover(false);
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

  return (
    <div
      key={props.item.id}
      className={itemClassName}
      ref={ref}
      onMouseEnter={() => setAdditionalButtonsHover(true)}
      onMouseLeave={() => {
        if (!more) {
          setAdditionalButtonsHover(false);
        }
      }}
    >
      <button
        className={autofillClassName}
        onClick={handleAutofillClick}
        ref={autofillBtnRef}
      >
        {generateIcon(props.item, faviconError, setFaviconError, props.loading)}
        <span>
          {props.loading ? <Skeleton /> : <span>{props.item.name || browser.i18n.getMessage('no_item_name')}</span>}
          {props.loading ? <Skeleton /> : (props?.login?.username && props?.login?.username?.length > 0 ? <span>{props.item.username}</span> : null)}
        </span>
      </button>
      <div className={S.servicesListItemAdditionalButtons}>
        <PasswordBtn login={props.item} more={more} setMore={toggleMenuCallback} />
        <UsernameBtn itemId={props.item.id} more={more} setMore={toggleMenuCallback} />
        <MoreBtn more={more} setMore={toggleMenuCallback} />
      </div>
      <Select
        className='react-select-dropdown-container'
        classNamePrefix='react-select-dropdown'
        isSearchable={false}
        options={dropdownOptions}
        menuIsOpen={true}
        menuPlacement='bottom'
        menuPosition='fixed'
        ref={selectRef}
        components={{
          Option: props => <CustomOption {...props} more={more} toggleMenu={toggleMenuCallback} />
        }}
      />
    </div>
  );
}

export default memo(LoginItem);
