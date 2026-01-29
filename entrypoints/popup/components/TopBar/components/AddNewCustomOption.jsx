// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useMemo } from 'react';
import { getItemsUiData } from '@/entrypoints/popup/constants';
import ClearLink from '../../ClearLink';
import { useI18n } from '@/partials/context/I18nContext';

const AddNewCustomOption = option => {
  const { getMessage } = useI18n();

  const itemsUiData = useMemo(() => getItemsUiData(getMessage), [getMessage]);

  const handleClick = () => {
    if (option?.selectProps?.setIsMenuOpen) {
      option.selectProps.setIsMenuOpen(false);
    }
  };

  return (
    <div className={`react-select-add-new__option ${option?.selectProps?.pathname === option.data.value ? 'active' : ''}`}>
      <ClearLink
        to={option.data.value}
        title={`${getMessage('top_bar_create_new')} ${option.data.label}`}
        onClick={handleClick}
      >
        <span className={`react-select-add-new__option-icon ${itemsUiData[option.data.item].selectClassName}`}>
          {itemsUiData[option.data.item].svg}
        </span>
        <span className='react-select-add-new__option-label'>{option.data.label}</span>
      </ClearLink>
    </div>
  );
};

export default AddNewCustomOption;
