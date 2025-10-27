// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Tags.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { Field } from 'react-final-form';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useState, useEffect, useRef, useCallback, useMemo, lazy } from 'react';
import getTags from '@/partials/sessionStorage/getTags';
import Select from 'react-select';
import usePopupStateStore from '../../../../store/popupState';
import getItem from '@/partials/sessionStorage/getItem';

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

const getTagName = (tagID, availableTags) => {
  const tag = availableTags.find(t => t.id === tagID);
  return tag ? tag.name : tagID;
};

/**
* Function to render the tags input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Tags (props) {
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const { formData } = props;
  const { form } = formData;
  
  const [availableTags, setAvailableTags] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const options = useMemo(() => {
    const selectedTagIdsSet = new Set(data.item.tags);
    const unselectedTags = availableTags.filter(tag => !selectedTagIdsSet.has(tag.id));

    return unselectedTags.map(tag => ({
      value: tag.id,
      label: tag.name,
      tag: tag
    }));
  }, [availableTags, data.item.tags]);

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

  const handleTagsEditable = async () => {
    if (data.tagsEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);
      const itemData = data.item.toJSON();
      itemData.tags = item.tags;
      const updatedItem = new (data.item.constructor)(itemData);
      item = null;

      setData('tagsEditable', false);
      setData('item', updatedItem);
      setIsMenuOpen(false);
    } else {
      setData('tagsEditable', true);
    }
  };

  const handleRemoveTag = tagId => {
    const newTagIds = data.item.tags.filter(id => id !== tagId);
    const itemData = data.item.toJSON();
    itemData.tags = newTagIds;
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isPasswordDecrypted) {
      updatedItem.setPasswordDecrypted(data.item.passwordDecrypted);
    }

    setData('item', updatedItem);
    form.change('tags', newTagIds);
  };

  const handleSelectChange = option => {
    if (option && option.tag) {
      const newTagIds = [...data.item.tags, option.tag.id];
      const itemData = data.item.toJSON();
      itemData.tags = newTagIds;
      itemData.internalData = { ...data.item.internalData };
      const updatedItem = new (data.item.constructor)(itemData);

      if (data.item.isPasswordDecrypted) {
        updatedItem.setPasswordDecrypted(data.item.passwordDecrypted);
      }

      setData('item', updatedItem);
      form.change('tags', newTagIds);
    }

    setIsMenuOpen(false);
  };

  const handleAddButtonClick = useCallback(() => {
    if (data.tagsEditable) {
      setIsMenuOpen(!isMenuOpen);

      if (!isMenuOpen && selectRef.current) {
        selectRef.current.focus();
      }
    }
  }, [data.tagsEditable, isMenuOpen]);

  return (
    <Field name="tags">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.tagsEditable ? pI.resizable : pI.disabled}`}>
          <div className={pI.passInputTop}>
            <div className={pI.passInputTopLabelLike}>
              <span>{browser.i18n.getMessage('details_tags_label')}</span>
            </div>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleTagsEditable}
            >
              {data.tagsEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottomMotion}>
            <LazyMotion features={loadDomAnimation}>
              <div className={`${S.tagsContainer} ${data.tagsEditable ? S.editable : S.disabled}`}>
                {data.item.tags.length > 0 ? (
                  data.item.tags.map(tag => (
                    <m.div
                      key={tag}
                      className={`${S.tagsPill} ${data.tagsEditable ? S.editable : ''}`}
                      title={getTagName(tag.id, availableTags)}
                      variants={animationVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                      transition={{ duration: 0.2 }}
                    >
                      <span className={S.tagsPillText} title={getTagName(tag, availableTags)}>
                        {getTagName(tag, availableTags)}
                      </span>
                      {data.tagsEditable && (
                        <button
                          type='button'
                          className={S.tagsPillDelete}
                          onClick={() => handleRemoveTag(tag)}
                          title={browser.i18n.getMessage('details_tags_remove')}
                        >
                          <CloseIcon />
                        </button>
                      )}
                    </m.div>
                  ))
                ) : (
                  !data.tagsEditable && (
                    <span className={S.tagsPlaceholder}>
                      {browser.i18n.getMessage('details_tags_no_tags')}
                    </span>
                  )
                )}

                {data.tagsEditable && options.length > 0 && (
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