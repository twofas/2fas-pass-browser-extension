// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { lazy, useState, useRef, useEffect, useMemo } from 'react';
import Select from 'react-select';

const FiltersIcon = lazy(() => import('@/assets/popup-window/filters.svg?react'));

/** 
* Function to render the Filters component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const Filters = ({ tags, selectedTag, onTagChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selectRef = useRef(null);
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  const options = useMemo(() => {
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

  const customStyles = {
    control: () => ({
      display: 'none'
    }),
    menu: (provided) => ({
      ...provided,
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: 4,
      minWidth: 200,
      zIndex: 10
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: 300
    }),
    option: (provided, state) => ({
      ...provided,
      cursor: 'pointer'
    })
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className={S.thisTabAllLoginsSearchContainerTags} style={{ position: 'relative' }}>
        <button 
          ref={buttonRef}
          className={`${bS.btn} ${bS.btnFilter}`}
          onClick={handleButtonClick}
          title={browser.i18n.getMessage('filters_button_title')}
        >
          <FiltersIcon />
        </button>
        <Select
          ref={selectRef}
          options={options}
          value={selectedOption}
          onChange={handleSelectChange}
          menuIsOpen={isMenuOpen}
          onMenuClose={() => setIsMenuOpen(false)}
          onMenuOpen={() => setIsMenuOpen(true)}
          styles={customStyles}
          className='react-select-container'
          classNamePrefix='react-select'
          isClearable={false}
          isSearchable={false}
        />
      </div>
    </>
  );
};

export default Filters;
