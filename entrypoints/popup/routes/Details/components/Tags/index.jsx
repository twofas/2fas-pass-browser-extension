// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Tags.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { Field } from 'react-final-form';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useState, useEffect, useRef, useCallback, useMemo, lazy } from 'react';
import getTags from '@/partials/sessionStorage/getTags';
import Select from 'react-select';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const CloseIcon = lazy(() => import('@/assets/popup-window/close.svg?react'));
const PlusIcon = lazy(() => import('@/assets/popup-window/add-new-2.svg?react'));

const animationVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

const CustomOption = option => {
  const handleClick = e => {
    e.preventDefault();
    e.stopPropagation();
    option.selectOption(option.data);
  };

  return (
    <div className='react-select-tags-details__option' onClick={handleClick}>
      <span title={option.data.label}>
        {option.data.label}
      </span>
    </div>
  );
};

/**
* Function to render the tags input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Tags (props) {
  const { data } = props; // actions
  const { service, tagsEditable, form } = data;
  // const { setTagsEditable } = actions;
  
  const [availableTags, setAvailableTags] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const selectRef = useRef(null);
  const addButtonRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getTags();
        setAvailableTags(tags);
      } catch (e) {
        CatchError(e);
      }
    };

    fetchTags();
  }, []);

  useEffect(() => {
    if (!initialized && service) {
      const initialTagIds = service?.tags && Array.isArray(service.tags) ? service.tags : [];
      setSelectedTagIds(initialTagIds);
      
      if (form) {
        form.change('tags', initialTagIds);
      }
      setInitialized(true);
    }
  }, [service, form, initialized]);

  const selectedTags = useMemo(() => {
    return selectedTagIds.map(tagId => {
      const tag = availableTags.find(t => t.id === tagId);
      return tag || null;
    }).filter(Boolean);
  }, [selectedTagIds, availableTags]);

  const options = useMemo(() => {
    const unselectedTags = availableTags.filter(tag => !selectedTagIds.includes(tag.id));
    return unselectedTags.map(tag => ({
      value: tag.id,
      label: tag.name,
      tag: tag
    }));
  }, [availableTags, selectedTagIds]);

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

  // const handleEditClick = useCallback(() => {
  //   setTagsEditable(!tagsEditable);
  //   if (tagsEditable) {
  //     setIsMenuOpen(false);
  //   }
  // }, [tagsEditable, setTagsEditable]);

  const handleRemoveTag = useCallback((tagId) => {
    const newTagIds = selectedTagIds.filter(id => id !== tagId);
    setSelectedTagIds(newTagIds);
    
    if (form) {
      form.change('tags', newTagIds);
    }
  }, [selectedTagIds, form]);

  const handleSelectChange = useCallback((option) => {
    if (option && option.tag) {
      const newTagIds = [...selectedTagIds, option.tag.id];
      setSelectedTagIds(newTagIds);
      
      if (form) {
        form.change('tags', newTagIds);
      }
    }
    setIsMenuOpen(false);
  }, [selectedTagIds, form]);

  const handleAddButtonClick = useCallback(() => {
    if (tagsEditable) {
      setIsMenuOpen(!isMenuOpen);
      if (!isMenuOpen && selectRef.current) {
        selectRef.current.focus();
      }
    }
  }, [tagsEditable, isMenuOpen]);

  return (
    <Field name="tags">
      {({ input }) => (
        <div className={`${pI.passInput} ${tagsEditable ? pI.resizable : pI.disabled}`}>
          <div className={pI.passInputTop}>
            <div className={pI.passInputTopLabelLike}>
              <span>{browser.i18n.getMessage('details_tags_label')}</span>
            </div>
            {/* <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleEditClick}
            >
              {tagsEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button> */}
          </div>
          <div className={pI.passInputBottomMotion}>
            <LazyMotion features={loadDomAnimation}>
              <div className={`${S.tagsContainer} ${tagsEditable ? S.editable : S.disabled}`}>
                {selectedTags.length > 0 ? (
                  selectedTags.map(tag => (
                    <m.div
                      key={tag.id}
                      className={`${S.tagsPill} ${tagsEditable ? S.editable : ''}`}
                      title={tag.name}
                      variants={animationVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                      transition={{ duration: 0.2 }}
                    >
                      <span className={S.tagsPillText} title={tag.name}>
                        {tag.name}
                      </span>
                      {tagsEditable && (
                        <button
                          type='button'
                          className={S.tagsPillDelete}
                          onClick={() => handleRemoveTag(tag.id)}
                          title={browser.i18n.getMessage('details_tags_remove')}
                        >
                          <CloseIcon />
                        </button>
                      )}
                    </m.div>
                  ))
                ) : (
                  !tagsEditable && (
                    <span className={S.tagsPlaceholder}>
                      {browser.i18n.getMessage('details_tags_no_tags')}
                    </span>
                  )
                )}
                
                {tagsEditable && options.length > 0 && (
                  <div ref={containerRef} className={S.tagsSelectContainer}>
                    <button
                      ref={addButtonRef}
                      type='button'
                      className={S.tagsAddButton}
                      onClick={handleAddButtonClick}
                      title={browser.i18n.getMessage('details_tags_add')}
                    >
                      <PlusIcon />
                      <span>{browser.i18n.getMessage('details_tags_add')}</span>
                    </button>
                    
                    <Select
                      ref={selectRef}
                      options={options}
                      value={null}
                      onChange={handleSelectChange}
                      menuIsOpen={isMenuOpen}
                      onMenuClose={() => setIsMenuOpen(false)}
                      onMenuOpen={() => setIsMenuOpen(true)}
                      className='react-select-tags-details-container'
                      classNamePrefix='react-select-tags-details'
                      isClearable={false}
                      isSearchable={false}
                      placeholder={browser.i18n.getMessage('details_tags_select_tag')}
                      noOptionsMessage={() => null}
                      components={{
                        Option: props => <CustomOption {...props} />
                      }}
                    />
                  </div>
                )}
              </div>
            </LazyMotion>
            
            <textarea
              {...input}
              style={{ display: 'none' }}
              value={JSON.stringify(input.value || [])}
              readOnly
            />
          </div>
        </div>
      )}
    </Field>
  );
}

export default Tags;