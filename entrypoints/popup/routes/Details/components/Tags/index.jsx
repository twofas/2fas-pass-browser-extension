// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Tags.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { Field } from 'react-final-form';
import { motion } from 'motion/react';
import { useState, useRef, useCallback, useMemo, memo } from 'react';
import useTags from '../../../../hooks/useTags';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import usePopupState from '../../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../../functions/updateItem';
import CloseIcon from '@/assets/popup-window/close.svg?react';
import PlusIcon from '@/assets/popup-window/add-new-2.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

const animationVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

const CustomOption = memo(function CustomOption (option) {
  const handleClick = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    option.selectOption(option.data);
  }, [option.selectOption, option.data]);

  return (
    <div className='react-select-tags-details__option' onClick={handleClick}>
      {option.data.color && <span className={`react-select-tags-details__option_color ${option.data.color}`}></span>}
      <span title={option.data.label}>
        {option.data.label}
      </span>
    </div>
  );
});

const selectComponents = { Option: CustomOption };
const noOptionsMessage = () => null;

const getTagName = (tagID, availableTags) => {
  const tag = availableTags.find(t => t.id === tagID);
  return tag ? tag.name : null;
};

const getTagColor = (tagID, availableTags) => {
  const tag = availableTags.find(t => t.id === tagID);
  return tag ? tag.color : null;
};

/**
* Function to render the tags input field.
* @return {JSX.Element} The rendered component.
*/
function Tags () {
  const { getMessage } = useI18n();
  const { data, setData, setItem } = usePopupState();
  const { tags: availableTags } = useTags();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selectRef = useRef(null);
  const addButtonRef = useRef(null);
  const containerRef = useRef(null);

  const availableTagIds = useMemo(() => new Set(availableTags.map(tag => tag.id)), [availableTags]);

  const validTags = useMemo(
    () => data.item.tags.filter(tagId => availableTagIds.has(tagId)),
    [data.item.tags, availableTagIds]
  );

  const options = useMemo(() => {
    const selectedTagIdsSet = new Set(validTags);
    const unselectedTags = availableTags.filter(tag => !selectedTagIdsSet.has(tag.id));

    return unselectedTags.map(tag => ({
      value: tag.id,
      label: tag.name,
      tag: tag,
      color: tag.color
    }));
  }, [availableTags, validTags]);

  const handleTagsEditable = async () => {
    if (data.tagsEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        tags: item.tags,
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('tagsEditable', false);
      setIsMenuOpen(false);
    } else {
      if (availableTags.length === 0) {
        showToast(getMessage('details_tags_no_available'), 'info');
        return;
      }

      setData('tagsEditable', true);
    }
  };

  const handleRemoveTag = async tagId => {
    const newTagIds = data.item.tags.filter(id => id !== tagId);

    const updatedItem = await updateItem(data.item, {
      tags: newTagIds,
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  };

  const handleSelectChange = useCallback(async option => {
    if (option && option.tag) {
      const newTagIds = [...data.item.tags, option.tag.id];

      const updatedItem = await updateItem(data.item, {
        tags: newTagIds,
        internalData: { ...data.item.internalData }
      });

      setItem(updatedItem);
    }

    setIsMenuOpen(false);
  }, [data.item, setItem]);

  const handleMenuClose = useCallback(() => setIsMenuOpen(false), []);
  const handleMenuOpen = useCallback(() => setIsMenuOpen(true), []);

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
              <span>{getMessage('details_tags_label')}</span>
            </div>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleTagsEditable}
              tabIndex={-1}
            >
              {data.tagsEditable ? getMessage('cancel') : getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottomMotion}>
            <div className={`${S.tagsContainer} ${data.tagsEditable ? S.editable : S.disabled}`}>
              {validTags.length > 0 ? (
                validTags.map(tagId => (
                  <motion.div
                    key={tagId}
                    className={`${S.tagsPill} ${data.tagsEditable ? S.editable : ''}`}
                    title={getTagName(tagId, availableTags)}
                    variants={animationVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    {getTagColor(tagId, availableTags) && (
                      <span className={`${S.tagsPillColor} ${getTagColor(tagId, availableTags)}`}></span>
                    )}
                    <span className={S.tagsPillText} title={getTagName(tagId, availableTags)}>
                      {getTagName(tagId, availableTags)}
                    </span>
                    {data.tagsEditable && (
                      <button
                        type='button'
                        className={S.tagsPillDelete}
                        onClick={() => handleRemoveTag(tagId)}
                        title={getMessage('details_tags_remove')}
                      >
                        <CloseIcon />
                      </button>
                    )}
                  </motion.div>
                ))
              ) : (
                !data.tagsEditable && (
                  <span className={S.tagsPlaceholder}>
                    {getMessage('details_tags_no_tags')}
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
                    title={getMessage('details_tags_add')}
                  >
                    <PlusIcon />
                    <span>{getMessage('details_tags_add')}</span>
                  </button>

                  <AdvancedSelect
                    ref={selectRef}
                    options={options}
                    value={null}
                    onChange={handleSelectChange}
                    menuIsOpen={isMenuOpen}
                    onMenuClose={handleMenuClose}
                    onMenuOpen={handleMenuOpen}
                    className='react-select-pass-dropdown'
                    classNamePrefix='react-select-tags-details'
                    isClearable={false}
                    isSearchable={false}
                    placeholder={getMessage('details_tags_select_tag')}
                    noOptionsMessage={noOptionsMessage}
                    triggerRef={addButtonRef}
                    components={selectComponents}
                  />
                </div>
              )}
            </div>
            
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