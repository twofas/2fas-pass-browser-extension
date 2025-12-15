// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { itemsUiData } from '@/entrypoints/popup/constants';
import { Link } from 'react-router';

const AddNewCustomOption = option => {
  return (
    <div className={`react-select-add-new__option ${option?.selectProps?.pathname === option.data.value ? 'active' : ''}`}>
      <Link
        to={option.data.value}
        title={`${browser.i18n.getMessage('top_bar_create_new')} ${option.data.label}`}
        onClick={() => option?.selectProps?.setIsMenuOpen ? option?.selectProps?.setIsMenuOpen(false) : {}}
      >
        <span className={`react-select-add-new__option-icon ${itemsUiData[option.data.item].selectClassName}`}>
          {itemsUiData[option.data.item].svg}
        </span>
        <span className='react-select-add-new__option-label'>{option.data.label}</span>
      </Link>
    </div>
  );
};

export default AddNewCustomOption;
