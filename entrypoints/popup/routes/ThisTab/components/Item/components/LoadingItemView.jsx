// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { memo } from 'react';
import ItemIcon from '@/entrypoints/popup/components/ItemIcon';
import Skeleton from '@/entrypoints/popup/routes/ThisTab/components/Skeleton';

const SKELETON_NAME_STYLE = { width: '100px' };
const SKELETON_SECONDARY_STYLE = { width: '60px' };

function LoadingItemView (props) {
  return (
    <div className={S.itemAutofill} ref={props.autofillBtnRef}>
      <ItemIcon item={null} loading={true} />
      <span>
        <Skeleton style={SKELETON_NAME_STYLE} />
        <Skeleton style={SKELETON_SECONDARY_STYLE} />
      </span>
    </div>
  );
}

export default memo(LoadingItemView);
