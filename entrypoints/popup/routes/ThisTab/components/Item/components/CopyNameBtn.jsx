// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import handleName from '../functions/handleName';
import CopyTooltip from '@/entrypoints/popup/components/CopyTooltip';
import ItemCopyNameIcon from '@/assets/popup-window/copy-name.svg?react';

const CopyNameBtn = ({ item, more, setMore }) => {
  const { getMessage } = useI18n();
  const isEmpty = !item?.content?.name;

  return (
    <CopyTooltip text={getMessage('this_tab_copy_disabled_no_name')} active={isEmpty} position='bottom'>
      <button
        onClick={async () => await handleName(item.deviceId, item.vaultId, item.id, more, setMore)}
        title={isEmpty ? undefined : getMessage('this_tab_copy_name')}
        disabled={isEmpty}
      >
        <ItemCopyNameIcon className={S.itemName} />
      </button>
    </CopyTooltip>
  );
};

export default CopyNameBtn;
