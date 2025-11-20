// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import { memo, lazy, useRef, useMemo, useCallback } from 'react';
import generateIcon from '../../../functions/serviceList/generateIcon';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import toggleMenu from '../functions/toggleMenu';

const Skeleton = lazy(() => import('../../Skeleton'));
const CopyNameBtn = lazy(() => import('../components/CopyNameBtn'));
const CopySecureNoteBtn = lazy(() => import('../components/CopySecureNoteBtn'));
const MoreBtn = lazy(() => import('../../../functions/serviceList/additionalButtons/MoreBtn'));
const CustomOption = lazy(() => import('../components/CustomOption'));

function SecureNoteItemView (props) {
  const moreBtnRef = useRef(null);

  const dropdownOptions = useMemo(() => props.data?.dropdownList || [], [props.data?.dropdownList]);

  const toggleMenuCallback = useCallback(value => {
    toggleMenu(value, { ref: props.ref, selectRef: props.selectRef }, { setMore: props.setMore });
  }, [props.setMore]);

  return (
    <>
      <div
        className={S.servicesListItemAutofill}
        ref={props.autofillBtnRef}
      >
        {generateIcon(props.data, null, null, props.loading)}
        <span>
          {props.loading ? <Skeleton /> : <span>{props?.data?.content?.name || browser.i18n.getMessage('no_item_name')}</span>}
        </span>
      </div>
      <div className={S.servicesListItemAdditionalButtons}>
        <CopySecureNoteBtn item={props.data} more={props.more} setMore={toggleMenuCallback} />
        <CopyNameBtn item={props.data} more={props.more} setMore={toggleMenuCallback} />
        <MoreBtn item={props.data} more={props.more} setMore={toggleMenuCallback} ref={moreBtnRef} />
      </div>
      <AdvancedSelect
        className='react-select-pass-dropdown'
        classNamePrefix='react-select-dropdown'
        isSearchable={false}
        options={dropdownOptions}
        menuIsOpen={props.more === true}
        ref={props.selectRef}
        triggerRef={moreBtnRef}
        components={{
          Option: props => <CustomOption {...props} more={props.more} toggleMenu={toggleMenuCallback} />
        }}
      />
    </>
  );
}

export default memo(SecureNoteItemView);
