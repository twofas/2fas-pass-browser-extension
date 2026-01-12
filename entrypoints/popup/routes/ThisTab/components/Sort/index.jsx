// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/Sort.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import SortIcon from '@/assets/popup-window/sort.svg?react';
import SortCustomOption from './components/SortCustomOption';

const selectComponents = { Option: SortCustomOption };

const options = [
  { value: 'az', label: browser.i18n.getMessage('sort_az') },
  { value: 'za', label: browser.i18n.getMessage('sort_za') },
  { value: 'newest', label: browser.i18n.getMessage('sort_newest') },
  { value: 'oldest', label: browser.i18n.getMessage('sort_oldest') }
];

/**
* Sort component for selecting item ordering with dropdown menu.
* @param {Object} props - The component props.
* @param {string} props.selectedSort - Currently selected sort value.
* @param {Function} props.onSortChange - Callback when sort selection changes.
* @param {boolean} props.forceClose - Flag to force close the dropdown menu.
* @return {JSX.Element} The rendered sort dropdown component.
*/
const Sort = ({ selectedSort, onSortChange, forceClose }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = useMemo(() => {
    if (!selectedSort) {
      return null;
    }

    return options.find(opt => opt.value === selectedSort) || null;
  }, [selectedSort]);

  const handleButtonClick = useCallback(() => {
    setIsMenuOpen(prev => !prev);

    if (!isMenuOpen && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isMenuOpen]);

  const handleSelectChange = useCallback(option => {
    if (onSortChange) {
      onSortChange(option ? option.value : null);
    }

    setIsMenuOpen(false);
  }, [onSortChange]);

  const handleMenuClose = useCallback(() => setIsMenuOpen(false), []);

  const handleMenuOpen = useCallback(() => setIsMenuOpen(true), []);

  useEffect(() => {
    if (forceClose) {
      setIsMenuOpen(false);
    }
  }, [forceClose]);

  return (
    <div className={S.sort}>
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
  );
};

export default memo(Sort);
