// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import { memo, lazy, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import generateIcon from '../../../functions/serviceList/generateIcon';
import AdvancedSelect from '@/partials/components/AdvancedSelect';

const Skeleton = lazy(() => import('../../Skeleton'));
const MoreBtn = lazy(() => import('../../../functions/serviceList/additionalButtons/MoreBtn'));
const CustomOption = lazy(() => import('../components/CustomOption'));

function PaymentCardItemView (props) {
  const moreBtnRef = useRef(null);
  const navigate = useNavigate();

  const dropdownOptions = useMemo(() => props.data?.dropdownList || [], [props.data?.dropdownList]);

  const handleAutofillClick = useCallback(async () => {
    console.log('Autofill payment card not implemented yet');
  }, [props?.data?.deviceId, props?.data?.vaultId, props?.data?.id, navigate, props.more]);

  return (
    <>
      <button
        className={S.servicesListItemAutofill}
        onClick={handleAutofillClick}
        ref={props.autofillBtnRef}
      >
        {generateIcon(props.data, null, null, props.loading)}
        <span>
          {props.loading ? <Skeleton /> : <span>{props?.data?.content?.name || browser.i18n.getMessage('no_item_name')}</span>}
          {props.loading ? <Skeleton /> : <span>{props?.data?.content?.cardNumberMask ? `**** **** **** ${props?.data?.content?.cardNumberMask}` : browser.i18n.getMessage('no_item_name')}</span>} {/* @TODO: i18n */}
        </span>
      </button>
      <div className={S.servicesListItemAdditionalButtons}>
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
        components={{
          Option: CustomOption
        }}
      />
    </>
  );
}

export default memo(PaymentCardItemView);
