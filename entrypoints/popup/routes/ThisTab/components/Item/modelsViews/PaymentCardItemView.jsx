// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { memo, useRef, useMemo, useCallback } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import { useNavigate } from 'react-router';
import ItemIcon from '../../../functions/serviceList/generateIcon';
import handleAutofill from '../../../functions/serviceList/handleAutofill';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import Skeleton from '../../Skeleton';
import MoreBtn from '../../../functions/serviceList/additionalButtons/MoreBtn';
import CopyCardNumberBtn from '../components/CopyCardNumberBtn';
import CopyCardSecurityCodeBtn from '../components/CopyCardSecurityCodeBtn';
import ItemCustomOption from '../components/ItemCustomOption';

const selectComponents = { Option: ItemCustomOption };
const SKELETON_NAME_STYLE = { width: '100px' };
const SKELETON_CARD_STYLE = { width: '60px' };

function PaymentCardItemView (props) {
  const { getMessage } = useI18n();
  const moreBtnRef = useRef(null);
  const navigate = useNavigate();
  const moreRef = useRef(props.more);
  moreRef.current = props.more;

  const dropdownOptions = useMemo(() => props.data?.dropdownList || [], [props.data?.dropdownList]);

  const handleAutofillClick = useCallback(async () => {
    if (!props.data?.id) {
      return;
    }

    await handleAutofill(props.data.deviceId, props.data.vaultId, props.data.id, navigate, moreRef.current, props.setMore);
  }, [props?.data?.deviceId, props?.data?.vaultId, props?.data?.id, navigate]);

  return (
    <>
      <button
        className={S.itemAutofill}
        onClick={handleAutofillClick}
        ref={props.autofillBtnRef}
      >
        <ItemIcon item={props.data} loading={props.loading} />
        <span>
          {props.loading ? <Skeleton style={SKELETON_NAME_STYLE} /> : <span>{props?.data?.content?.name || getMessage('no_item_name')}</span>}
          {props.loading ? <Skeleton style={SKELETON_CARD_STYLE} /> : <span>{props?.data?.content?.cardNumberMask ? `**** ${props?.data?.content?.cardNumberMask}` : getMessage('no_item_name')}</span>}
        </span>
      </button>
      <div className={S.itemAdditionalButtons}>
        <CopyCardNumberBtn item={props.data} more={props.more} setMore={props.setMore} />
        <CopyCardSecurityCodeBtn item={props.data} more={props.more} setMore={props.setMore} />
        <MoreBtn item={props.data} more={props.more} setMore={props.setMore} ref={moreBtnRef} />
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

export default memo(PaymentCardItemView, arePropsEqual);
