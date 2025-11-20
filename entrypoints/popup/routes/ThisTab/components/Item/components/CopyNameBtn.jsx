// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import { lazy } from 'react';
import handleName from '../../../functions/serviceList/handleName';

const CopyNameIcon = lazy(() => import('@/assets/popup-window/copy-name.svg?react'));

const CopyNameBtn = ({ item, more, setMore }) => {


  return (
    <button
      onClick={async () => await handleName(item.deviceId, item.vaultId, item.id, more, setMore)}
      title={browser.i18n.getMessage('this_tab_copy_password')}
    >
      <CopyNameIcon className={S.serviceName} />
    </button>
  );
};

export default CopyNameBtn;
