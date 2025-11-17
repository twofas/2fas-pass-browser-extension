// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import { useState } from 'react';
import usePopupStateStore from '@/entrypoints/popup/store/popupState';
import AllIcon from '@/assets/popup-window/items/all.svg?react';
import LoginIcon from '@/assets/popup-window/items/login.svg?react';
import SecureNoteIcon from '@/assets/popup-window/items/secure-note.svg?react';
import ChevronIcon from '@/assets/popup-window/chevron.svg?react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';

const itemModelsOptions = Object.freeze([
  { value: null, label: 'All Items', icon: <AllIcon className={S.modelAllIcon} /> },
  { value: 'Login', label: 'Logins', icon: <LoginIcon className={S.modelLoginIcon} /> },
  { value: 'SecureNote', label: 'Secure Notes', icon: <SecureNoteIcon className={S.modelSecureNoteIcon} /> }
]);

const ModalFilterCustomOption = option => {
  return (
    <div className='react-select-model-filter__option' onClick={() => {}}>
      <span
        className={option.data.value === null ? 'react-select-model-filter__option_clear' : ''}
        title={option.data.label}
      >
        {option.data.label}
      </span>
    </div>
  );
};

/** 
* Function to render the ModelFilter component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ModelFilter = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);
  // <h3>{browser.i18n.getMessage('this_tab_all_logins_header')}</h3>

  const generateModelIcon = () => {
    return (
      <span className={S.thisTabAllLoginsHeaderModelFilterIcon}>
        {itemModelsOptions.find(option => option.value === data.itemModelFilter)?.icon || <AllIcon className={S.modelAllIcon} />}
      </span>
    );
  };

  return (
    <>
      <>
        <button
          className={S.thisTabAllLoginsHeaderModelFilter}
          onClick={() => setIsMenuOpen(prevState => !prevState)}
        > 
          {generateModelIcon()}
          <span className={S.thisTabAllLoginsHeaderModelFilterText}>{browser.i18n.getMessage('this_tab_all_logins_header')}</span>
          <ChevronIcon className={S.thisTabAllLoginsHeaderModelFilterChevron} />
        </button>
        <AdvancedSelect
          options={itemModelsOptions}
          value={null}
          menuIsOpen={isMenuOpen}
          onMenuClose={() => setIsMenuOpen(false)}
          onMenuOpen={() => setIsMenuOpen(true)}
          className='react-select-model-filter-container'
          classNamePrefix='react-select-model-filter'
          isClearable={false}
          isSearchable={false}
          noOptionsMessage={() => null}
          components={{
            Option: props => <ModalFilterCustomOption {...props} setIsMenuOpen={setIsMenuOpen} />
          }}
        />
      </>
    </>
  );
};

export default ModelFilter;
