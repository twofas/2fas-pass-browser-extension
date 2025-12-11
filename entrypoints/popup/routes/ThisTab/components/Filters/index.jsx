// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/Filters.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { lazy, useState, useRef, useMemo, useCallback, memo, Suspense } from 'react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import IconFallback from '@/entrypoints/popup/components/IconFallback';
import FiltersCustomOption from './components/FiltersCustomOption';

const FiltersIcon = lazy(() => import('@/assets/popup-window/filters.svg?react'));

const selectComponents = { Option: FiltersCustomOption };

/**
* Filter component for selecting tags with dropdown menu.
* @param {Object} props - The component props.
* @param {Array} props.tags - Array of tag objects with id, name, and amount.
* @param {Object} props.selectedTag - Currently selected tag object or null.
* @param {Function} props.onTagChange - Callback when tag selection changes.
* @return {JSX.Element} The rendered filter dropdown component.
*/
const Filters = ({ tags, selectedTag, onTagChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);

  const options = useMemo(() => {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return [
        { value: 'noTags', label: browser.i18n.getMessage('filters_no_tags'), tag: null, isDisabled: true }
      ];
    }

    const tagOptions = tags.map(tag => ({
      value: tag.id,
      label: `${tag.name} (${tag.amount || 0})`,
      tag
    }));

    if (selectedTag) {
      tagOptions.push({
        value: null,
        label: browser.i18n.getMessage('filters_clear_choice'),
        tag: null
      });
    }

    return tagOptions;
  }, [tags, selectedTag]);

  const selectedOption = useMemo(() => {
    if (!selectedTag) {
      return null;
    }

    return options.find(opt => opt.value === selectedTag.id) || null;
  }, [selectedTag, options]);

  const handleButtonClick = useCallback(() => {
    setIsMenuOpen(prev => !prev);

    if (!isMenuOpen && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isMenuOpen]);

  const handleSelectChange = useCallback(option => {
    if (onTagChange) {
      onTagChange(option ? option.tag : null);
    }

    setIsMenuOpen(false);
  }, [onTagChange]);

  const handleMenuClose = useCallback(() => setIsMenuOpen(false), []);

  const handleMenuOpen = useCallback(() => setIsMenuOpen(true), []);

  return (
    <div className={S.filters}>
      <button
        ref={buttonRef}
        className={`${bS.btn} ${bS.btnFilter} ${isMenuOpen ? bS.btnFilterActive : ''}`}
        onClick={handleButtonClick}
        title={browser.i18n.getMessage('filters_button_title')}
      >
        <Suspense fallback={<IconFallback size={16} />}>
          <FiltersIcon />
        </Suspense>
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

export default memo(Filters);
