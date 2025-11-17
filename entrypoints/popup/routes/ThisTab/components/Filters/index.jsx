// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { lazy, useState, useRef, useEffect, useMemo } from 'react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';

const FiltersIcon = lazy(() => import('@/assets/popup-window/filters.svg?react'));

const CustomOption = option => {
  const handleClick = e => {
    e.preventDefault();
    e.stopPropagation();

    option.selectOption(option.data);
  };

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
};

/** 
* Function to render the Filters component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const Filters = ({ tags, selectedTag, onTagChange, forceClose }) => {
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
      tag: tag
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

  const handleButtonClick = () => {
    console.log('Filter button clicked, toggling menu', isMenuOpen);
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen && selectRef.current) {
      selectRef.current.focus();
    }
  };

  const handleSelectChange = (option) => {
    if (onTagChange) {
      onTagChange(option ? option.tag : null);
    }
    setIsMenuOpen(false);
  };

  const selectedOption = useMemo(() => {
    if (!selectedTag) {
      return null;
    }
    return options.find(opt => opt.value === selectedTag.id) || null;
  }, [selectedTag, options]);

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
          className={`${bS.btn} ${bS.btnFilter} ${isMenuOpen ? bS.btnFilterActive : ''}`}
          onClick={handleButtonClick}
          title={browser.i18n.getMessage('filters_button_title')}
        >
          <FiltersIcon />
        </button>
        
        <AdvancedSelect
          ref={selectRef}
          options={options}
          value={selectedOption}
          onChange={handleSelectChange}
          menuIsOpen={isMenuOpen}
          onMenuClose={() => setIsMenuOpen(false)}
          onMenuOpen={() => setIsMenuOpen(true)}
          className='react-select-tags-container'
          classNamePrefix='react-select-tags'
          isClearable={false}
          isSearchable={false}
          additionalButtonRefs={[buttonRef]}
          components={{
            Option: props => <CustomOption {...props} />
          }}
        />
      </div>
    </>
  );
};

export default Filters;
