// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { memo, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import generateIcon from '../../../functions/serviceList/generateIcon';
import handleAutofill from '../../../functions/serviceList/handleAutofill';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import Skeleton from '../../Skeleton';
import PasswordBtn from '../../../functions/serviceList/additionalButtons/PasswordBtn';
import MoreBtn from '../../../functions/serviceList/additionalButtons/MoreBtn';
import UsernameBtn from '../../../functions/serviceList/additionalButtons/UsernameBtn';
import ItemCustomOption from '../components/ItemCustomOption';

const selectComponents = { Option: ItemCustomOption };

/**
* Login item view component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function LoginItemView (props) {
  const [faviconError, setFaviconError] = useState(false);
  const moreBtnRef = useRef(null);
  const navigate = useNavigate();

  const dropdownOptions = useMemo(() => props.data?.dropdownList || [], [props.data?.dropdownList]);

  const autofillClassName = useMemo(() =>
    `${S.itemAutofill} ${props.more ? S.hover : ''}`,
    [props.more]
  );

  const handleAutofillClick = useCallback(async () => {
    if (!props.data?.id) {
      return;
    }

    await handleAutofill(props.data.deviceId, props.data.vaultId, props.data.id, navigate, props.more, props.setMore);
  }, [props?.data?.deviceId, props?.data?.vaultId, props?.data?.id, navigate, props.more]);

  return (
    <>
      <button
        className={autofillClassName}
        onClick={handleAutofillClick}
        ref={props.autofillBtnRef}
      >
        {generateIcon(props.data, faviconError, setFaviconError, props.loading)}
        <span>
          {props.loading ? <Skeleton style={{ width: '100px' }} /> : <span>{props?.data?.content?.name || browser.i18n.getMessage('no_item_name')}</span>}
          {props.loading ? <Skeleton style={{ width: '60px' }} /> : (props?.data?.content?.username && props?.data?.content?.username?.length > 0 ? <span>{props.data.content.username}</span> : null)}
        </span>
      </button>
      <div className={S.itemAdditionalButtons}>
        <PasswordBtn item={props.data} more={props.more} setMore={props.setMore} />
        <UsernameBtn deviceId={props.data.deviceId} vaultId={props.data.vaultId} itemId={props.data.id} more={props.more} setMore={props.setMore} />
        <MoreBtn more={props.more} setMore={props.setMore} ref={moreBtnRef} />
      </div>
      <AdvancedSelect
        className='react-select-pass-dropdown'
        classNamePrefix='react-select-dropdown'
        isSearchable={false}
        options={dropdownOptions}
        menuIsOpen={props.more === true}
        ref={props.selectRef}
        triggerRef={moreBtnRef}
        setMore={props.setMore}
        components={selectComponents}
      />
    </>
  );
}

/**
* Custom comparison function to prevent unnecessary re-renders.
* @param {Object} prevProps - Previous props.
* @param {Object} nextProps - Next props.
* @return {boolean} True if props are equal (should not re-render).
*/
function arePropsEqual (prevProps, nextProps) {
  return prevProps.data?.id === nextProps.data?.id &&
         prevProps.data?.sifExists === nextProps.data?.sifExists &&
         prevProps.more === nextProps.more &&
         prevProps.loading === nextProps.loading;
}

export default memo(LoginItemView, arePropsEqual);
