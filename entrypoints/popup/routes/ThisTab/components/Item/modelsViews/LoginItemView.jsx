// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { memo, useMemo, useRef, useCallback } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import { useNavigate } from 'react-router';
import ItemIcon from '../../../functions/serviceList/generateIcon';
import handleAutofill from '../../../functions/serviceList/handleAutofill';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import Skeleton from '../../Skeleton';
import PasswordBtn from '../../../functions/serviceList/additionalButtons/PasswordBtn';
import MoreBtn from '../../../functions/serviceList/additionalButtons/MoreBtn';
import UsernameBtn from '../../../functions/serviceList/additionalButtons/UsernameBtn';
import ItemCustomOption from '../components/ItemCustomOption';

const selectComponents = { Option: ItemCustomOption };
const SKELETON_NAME_STYLE = { width: '100px' };
const SKELETON_USERNAME_STYLE = { width: '60px' };

function LoginItemView (props) {
  const { getMessage } = useI18n();
  const moreBtnRef = useRef(null);
  const navigate = useNavigate();
  const moreRef = useRef(props.more);
  moreRef.current = props.more;

  const dropdownOptions = useMemo(() => props.data?.dropdownList || [], [props.data?.dropdownList]);

  const autofillClassName = useMemo(() =>
    `${S.itemAutofill} ${props.more ? S.hover : ''}`,
    [props.more]
  );

  const handleAutofillClick = useCallback(async () => {
    if (!props.data?.id) {
      return;
    }

    await handleAutofill(props.data.deviceId, props.data.vaultId, props.data.id, navigate, moreRef.current, props.setMore);
  }, [props?.data?.deviceId, props?.data?.vaultId, props?.data?.id, navigate]);

  return (
    <>
      <button
        className={autofillClassName}
        onClick={handleAutofillClick}
        ref={props.autofillBtnRef}
      >
        <ItemIcon item={props.data} loading={props.loading} />
        <span>
          {props.loading ? <Skeleton style={SKELETON_NAME_STYLE} /> : <span>{props?.data?.content?.name || getMessage('no_item_name')}</span>}
          {props.loading ? <Skeleton style={SKELETON_USERNAME_STYLE} /> : (props?.data?.content?.username && props?.data?.content?.username?.length > 0 ? <span>{props.data.content.username}</span> : null)}
        </span>
      </button>
      <div className={S.itemAdditionalButtons}>
        <PasswordBtn item={props.data} more={props.more} setMore={props.setMore} />
        <UsernameBtn deviceId={props.data.deviceId} vaultId={props.data.vaultId} itemId={props.data.id} more={props.more} setMore={props.setMore} />
        <MoreBtn more={props.more} setMore={props.setMore} ref={moreBtnRef} />
      </div>
      {props.more && (
        <AdvancedSelect
          className='react-select-pass-dropdown'
          classNamePrefix='react-select-dropdown'
          isSearchable={false}
          options={dropdownOptions}
          menuIsOpen
          ref={props.selectRef}
          triggerRef={moreBtnRef}
          setMore={props.setMore}
          components={selectComponents}
        />
      )}
    </>
  );
}

function arePropsEqual (prevProps, nextProps) {
  return prevProps.data?.id === nextProps.data?.id &&
         prevProps.data?.sifExists === nextProps.data?.sifExists &&
         prevProps.more === nextProps.more &&
         prevProps.loading === nextProps.loading;
}

export default memo(LoginItemView, arePropsEqual);
