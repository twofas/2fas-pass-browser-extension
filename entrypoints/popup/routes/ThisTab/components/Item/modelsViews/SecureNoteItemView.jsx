// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { memo, useRef, useMemo } from 'react';
import generateIcon from '../../../functions/serviceList/generateIcon';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import Skeleton from '../../Skeleton';
import CopyNameBtn from '../components/CopyNameBtn';
import CopySecureNoteBtn from '../components/CopySecureNoteBtn';
import MoreBtn from '../../../functions/serviceList/additionalButtons/MoreBtn';
import ItemCustomOption from '../components/ItemCustomOption';

const selectComponents = { Option: ItemCustomOption };

/**
* Secure note item view component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SecureNoteItemView (props) {
  const moreBtnRef = useRef(null);
  const dropdownOptions = useMemo(() => props.data?.dropdownList || [], [props.data?.dropdownList]);

  return (
    <>
      <div
        className={S.itemAutofill}
        ref={props.autofillBtnRef}
      >
        {generateIcon(props.data, null, null, props.loading)}
        <span>
          {props.loading ? <Skeleton style={{ width: '100px' }} /> : <span>{props?.data?.content?.name || browser.i18n.getMessage('no_item_name')}</span>}
        </span>
      </div>
      <div className={S.itemAdditionalButtons}>
        <CopySecureNoteBtn item={props.data} more={props.more} setMore={props.setMore} />
        <CopyNameBtn item={props.data} more={props.more} setMore={props.setMore} />
        <MoreBtn item={props.data} more={props.more} setMore={props.setMore} ref={moreBtnRef} />
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

export default memo(SecureNoteItemView, arePropsEqual);
