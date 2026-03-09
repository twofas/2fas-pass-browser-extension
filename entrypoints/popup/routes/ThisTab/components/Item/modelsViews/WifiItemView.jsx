// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { memo, useRef, useMemo } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import ItemIcon from '../../../functions/serviceList/generateIcon';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import Skeleton from '../../Skeleton';
import WifiPasswordBtn from '../components/WifiPasswordBtn';
import SsidBtn from '../components/SsidBtn';
import MoreBtn from '../../../functions/serviceList/additionalButtons/MoreBtn';
import ItemCustomOption from '../components/ItemCustomOption';

const selectComponents = { Option: ItemCustomOption };
const SKELETON_NAME_STYLE = { width: '100px' };
const SKELETON_SSID_STYLE = { width: '60px' };

function WifiItemView (props) {
  const { getMessage } = useI18n();
  const moreBtnRef = useRef(null);
  const dropdownOptions = useMemo(() => props.data?.dropdownList || [], [props.data?.dropdownList]);

  return (
    <>
      <div
        className={S.itemAutofill}
        ref={props.autofillBtnRef}
      >
        <ItemIcon item={props.data} loading={props.loading} />
        <span>
          {props.loading ? <Skeleton style={SKELETON_NAME_STYLE} /> : <span>{props?.data?.content?.name || getMessage('no_item_name')}</span>}
          {props.loading ? <Skeleton style={SKELETON_SSID_STYLE} /> : (props.data?.content?.ssid ? <span>{props.data.content.ssid}</span> : null)}
        </span>
      </div>
      <div className={S.itemAdditionalButtons}>
        <WifiPasswordBtn item={props.data} more={props.more} setMore={props.setMore} />
        <SsidBtn deviceId={props.data?.deviceId} vaultId={props.data?.vaultId} itemId={props.data?.id} more={props.more} setMore={props.setMore} />
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
          wifiItem={props.data}
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

export default memo(WifiItemView, arePropsEqual);
