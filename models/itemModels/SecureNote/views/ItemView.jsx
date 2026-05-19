// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '@/entrypoints/popup/routes/ThisTab/components/Item/styles/Item.module.scss';
import { memo, useRef, useMemo } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import ItemIcon from '@/entrypoints/popup/components/ItemIcon';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import Skeleton from '@/entrypoints/popup/routes/ThisTab/components/Skeleton';
import CopyNameBtn from '@/entrypoints/popup/routes/ThisTab/components/Item/components/CopyNameBtn';
import CopySecureNoteBtn from '@/entrypoints/popup/routes/ThisTab/components/Item/components/CopySecureNoteBtn';
import MoreBtn from '@/entrypoints/popup/routes/ThisTab/components/Item/components/MoreBtn';
import ItemCustomOption from '@/entrypoints/popup/routes/ThisTab/components/Item/components/ItemCustomOption';

const selectComponents = { Option: ItemCustomOption };
const SKELETON_NAME_STYLE = { width: '100px' };

function SecureNoteItemView (props) {
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
        </span>
      </div>
      <div className={S.itemAdditionalButtons}>
        <CopySecureNoteBtn item={props.data} more={props.more} setMore={props.setMore} />
        <CopyNameBtn item={props.data} more={props.more} setMore={props.setMore} />
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

export default memo(SecureNoteItemView, arePropsEqual);
