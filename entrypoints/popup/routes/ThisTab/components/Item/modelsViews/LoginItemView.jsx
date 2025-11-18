// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import { memo, useMemo, useState, lazy, useRef } from 'react';
import { useNavigate } from 'react-router';
import generateIcon from '../../../functions/serviceList/generateIcon';
import handleAutofill from '../../../functions/serviceList/handleAutofill';
import toggleMenu from '../functions/toggleMenu';
import AdvancedSelect from '@/partials/components/AdvancedSelect';

const Skeleton = lazy(() => import('../../Skeleton'));
const PasswordBtn = lazy(() => import('../../../functions/serviceList/additionalButtons/PasswordBtn'));
const MoreBtn = lazy(() => import('../../../functions/serviceList/additionalButtons/MoreBtn'));
const UsernameBtn = lazy(() => import('../../../functions/serviceList/additionalButtons/UsernameBtn'));
const CustomOption = lazy(() => import('../components/CustomOption'));

function LoginItemView (props) {
  const [faviconError, setFaviconError] = useState(false);
  const moreBtnRef = useRef(null);
  const navigate = useNavigate();

  const dropdownOptions = useMemo(() => props.data?.dropdownList || [], [props.data?.dropdownList]);

  const autofillClassName = useMemo(() =>
    `${S.servicesListItemAutofill} ${props.more ? S.hover : ''}`,
    [props.more]
  );

  const handleAutofillClick = useCallback(async () => {
    if (!props.data?.id) {
      return;
    }

    await handleAutofill(props.data.deviceId, props.data.vaultId, props.data.id, navigate, props.more, value => toggleMenu(value, { ref: props.ref, selectRef: props.selectRef }, { setMore: props.setMore }));
  }, [props?.data?.deviceId, props?.data?.vaultId, props?.data?.id, navigate, props.more]);

  const toggleMenuCallback = useCallback(value => {
    toggleMenu(value, { ref: props.ref, selectRef: props.selectRef }, { setMore: props.setMore });
  }, [props.setMore]);

  return (
    <>
      <button
        className={autofillClassName}
        onClick={handleAutofillClick}
        ref={props.autofillBtnRef}
      >
        {generateIcon(props.data, faviconError, setFaviconError, props.loading)}
        <span>
          {props.loading ? <Skeleton /> : <span>{props?.data?.content?.name || browser.i18n.getMessage('no_item_name')}</span>}
          {props.loading ? <Skeleton /> : (props?.data?.content?.username && props?.data?.content?.username?.length > 0 ? <span>{props.data.content.username}</span> : null)}
        </span>
      </button>
      <div className={S.servicesListItemAdditionalButtons}>
        <PasswordBtn item={props.data} more={props.more} setMore={toggleMenuCallback} />
        <UsernameBtn deviceId={props.data.deviceId} vaultId={props.data.vaultId} itemId={props.data.id} more={props.more} setMore={toggleMenuCallback} />
        <MoreBtn more={props.more} setMore={toggleMenuCallback} ref={moreBtnRef} />
      </div>
      <AdvancedSelect
        className='react-select-pass-dropdown'
        classNamePrefix='react-select-dropdown'
        isSearchable={false}
        options={dropdownOptions}
        menuIsOpen={props.more === true}
        ref={props.selectRef}
        additionalButtonRefs={[moreBtnRef]}
        triggerRef={moreBtnRef}
        components={{
          Option: props => <CustomOption {...props} more={props.more} toggleMenu={toggleMenuCallback} />
        }}
      />
    </>
  );
}

export default memo(LoginItemView);
