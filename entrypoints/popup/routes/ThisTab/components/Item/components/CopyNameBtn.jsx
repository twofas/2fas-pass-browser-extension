// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import handleName from '../../../functions/serviceList/handleName';
import ItemCopyNameIcon from '@/assets/popup-window/copy-name.svg?react';

const CopyNameBtn = ({ item, more, setMore }) => {
  const { getMessage } = useI18n();

  return (
    <button
      onClick={async () => await handleName(item.deviceId, item.vaultId, item.id, more, setMore)}
      title={getMessage('this_tab_copy_name')}
    >
      <ItemCopyNameIcon className={S.itemName} />
    </button>
  );
};

export default CopyNameBtn;
