// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import SortIcon from '@/assets/popup-window/sort.svg?react';

const CustomOption = memo(function CustomOption (option) {
  const handleClick = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    option.selectOption(option.data);
  }, [option.selectOption, option.data]);

  if (option.data.isDisabled) {
    return (
      <div className='react-select-tags__option react-select-tags__option_disabled'>
        <span
          className={option.data.value === null ? 'react-select-tags__option_clear' : ''}
          title={option.data.label}
        >
          {option.data.label}
        </span>
      </div>
    );
  }

  return (
    <div className='react-select-tags__option' onClick={handleClick}>
      <span
        className={option.data.value === null ? 'react-select-tags__option_clear' : ''}
        title={option.data.label}
      >
        {option.data.label}
      </span>
      {option.data.value === null ? null : (
        <span className={`react-select-tags__option-circle ${option.isSelected ? 'selected' : ''}`}>
          <span></span>
        </span>
      )}
    </div>
  );
});

const selectComponents = { Option: CustomOption };

const options = [
  { value: 'az', label: browser.i18n.getMessage('sort_az') },
  { value: 'za', label: browser.i18n.getMessage('sort_za') },
  { value: 'newest', label: browser.i18n.getMessage('sort_newest') },
  { value: 'oldest', label: browser.i18n.getMessage('sort_oldest') }
];

/** 
* Function to render the Sort component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const Sort = ({ selectedSort, onSortChange, forceClose }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const handleButtonClick = () => {
    setIsMenuOpen(!isMenuOpen);

    if (!isMenuOpen && selectRef.current) {
      selectRef.current.focus();
    }
  };

  const handleSelectChange = useCallback(option => {
    if (onSortChange) {
      onSortChange(option ? option.value : null);
    }

    setIsMenuOpen(false);
  }, [onSortChange]);

  const handleMenuClose = useCallback(() => setIsMenuOpen(false), []);
  const handleMenuOpen = useCallback(() => setIsMenuOpen(true), []);

  const selectedOption = useMemo(() => {
    if (!selectedSort) {
      return null;
    }

    return options.find(opt => opt.value === selectedSort) || null;
  }, [selectedSort, options]);

  useEffect(() => {
    if (forceClose) {
      setIsMenuOpen(false);
    }
  }, [forceClose]);

  return (
    <>
      <div className={S.thisTabAllLoginsSearchContainerTags} style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          className={`${bS.btn} ${bS.btnFilter} ${bS.sort} ${isMenuOpen ? bS.btnFilterActive : ''}`}
          onClick={handleButtonClick}
          title={browser.i18n.getMessage('filters_button_title')}
        >
          <SortIcon />
        </button>
        
        <AdvancedSelect
          ref={selectRef}
          options={options}
          value={selectedOption}
          onChange={handleSelectChange}
          menuIsOpen={isMenuOpen}
          onMenuClose={handleMenuClose}
          onMenuOpen={handleMenuOpen}
          className='react-select-pass-dropdown'
          classNamePrefix='react-select-tags'
          isClearable={false}
          isSearchable={false}
          triggerRef={buttonRef}
          components={selectComponents}
        />
      </div>
    </>
  );
};

export default Sort;
