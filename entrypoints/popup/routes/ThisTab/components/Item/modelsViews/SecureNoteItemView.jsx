// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import { memo, lazy } from 'react';
import { Link } from 'react-router';
import generateIcon from '../../../functions/serviceList/generateIcon';

const Skeleton = lazy(() => import('../../Skeleton'));
const DetailsIcon = lazy(() => import('@/assets/popup-window/details.svg?react'));
const CopyNameBtn = lazy(() => import('../components/CopyNameBtn'));
const CopySecureNoteBtn = lazy(() => import('../components/CopySecureNoteBtn'));

function SecureNoteItemView (props) {
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
        <CopySecureNoteBtn item={props.data} />
        <CopyNameBtn item={props.data} />

        <Link
          to={`/details/${props.data.deviceId}/${props.data.vaultId}/${props.data.id}`}
          className={S.serviceDetailsBtn}
          state={{
            from: 'thisTab',
            data: { ...props.data },
            // scrollPosition @TODO: implement scroll position saving
          }}
          prefetch='intent'
          title={browser.i18n.getMessage('this_tab_more_details')}
        >
          <DetailsIcon className={S.serviceDetails} />
        </Link>
      </div>
    </>
  );
}

export default memo(SecureNoteItemView);
