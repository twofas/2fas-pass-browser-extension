// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Details.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { lazy, useState } from 'react';
import { LazyMotion, animate } from 'motion/react';
import { useEffect, useRef } from 'react';
import { isText } from '@/partials/functions';
import usePopupStateStore from '../../../store/popupState';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const InfoIcon = lazy(() => import('@/assets/popup-window/info.svg?react'));

 /**
* Function to render the Secure Note text input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const TEXTAREA_LINE_HEIGHT = 19;

function SecureNoteText (props) {
  const { sifDecryptError, formData } = props;
  const { form, originalItem, inputError } = formData;

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const previousSifValueRef = useRef(null);
  const textareaRef = useRef(null);
  const [showTextarea, setShowTextarea] = useState(false);

  const getTextValue = () => {
    if (sifDecryptError) {
      return '';
    }

    if (isText(data.item.internalData.editedSif)) {
      return data.item.internalData.editedSif;
    }

    if (data.item.isSifDecrypted) {
      return data.item.sifDecrypted;
    }

    return '';
  };

  useEffect(() => {
    const currentTextValue = getTextValue();

    if (currentTextValue !== previousSifValueRef.current) {
      form.change('editedSif', currentTextValue);
      previousSifValueRef.current = currentTextValue;
    }
  }, [data.item.internalData.editedSif, data.item.sifDecrypted, data.item.isSifDecrypted, sifDecryptError, form]);

  useEffect(() => {
    if (data?.revealSecureNote) {
      setShowTextarea(true);

      const animateExpand = async () => {
        if (!textareaRef.current) {
          return;
        }

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = '0';
            const scrollHeight = textareaRef.current.scrollHeight;
            const targetHeight = Math.max(TEXTAREA_LINE_HEIGHT, Math.min(scrollHeight, 200));

            textareaRef.current.style.height = `${TEXTAREA_LINE_HEIGHT}px`;
            textareaRef.current.style.overflowY = 'hidden';

            animate(TEXTAREA_LINE_HEIGHT, targetHeight, {
              duration: .3,
              onUpdate: value => {
                if (textareaRef.current) {
                  textareaRef.current.style.height = `${value}px`;
                }
              },
            }).then(() => {
              if (textareaRef.current) {
                textareaRef.current.style.overflowY = 'auto';
              }
            });
          }
        }, 0);
      };

      animateExpand();
    } else if (!data?.revealSecureNote && showTextarea) {
      const animateCollapse = async () => {
        if (!textareaRef.current) {
          return;
        }

        const currentHeight = textareaRef.current.offsetHeight;

        textareaRef.current.style.overflowY = 'hidden';

        await animate(currentHeight, TEXTAREA_LINE_HEIGHT, {
          duration: .3,
          onUpdate: value => {
            if (textareaRef.current) {
              textareaRef.current.style.height = `${value}px`;
            }
          },
        });

        setShowTextarea(false);
      };

      animateCollapse();
    }
  }, [data?.revealSecureNote, showTextarea]);

  const generateErrorOverlay = () => {
    if (!sifDecryptError) {
      return null;
    }

    return (
      <div className={pI.passInputBottomOverlay}>
        <InfoIcon />
        <span>{browser.i18n.getMessage('details_secure_note_decrypt_error')}</span>
      </div>
    );
  };

  const generateSecurityTypeTooltip = item => {
    if (item?.isT3orT2WithSif) {
      return null;
    }

    // FUTURE - move to separate component
    return (
      <div className={pI.passInputTooltip}>
        <span>{browser.i18n.getMessage('details_sif_not_fetched')}</span>
      </div>
    );
  };

  const handleEditableClick = () => {
    if (data?.sifEditable) {
      const itemData = data.item.toJSON();
      itemData.internalData = { ...data.item.internalData };
      const updatedItem = new (data.item.constructor)(itemData);

      if (data.item.isSifDecrypted) {
        updatedItem.setSifDecrypted(data.item.sifDecrypted);
      }

      updatedItem.internalData.editedSif = null;

      setData('item', updatedItem);
      setData('sifEdited', false);
      setData('sifEditable', false);
      setData('revealSecureNote', false);
      form.change('editedSif', data.item.isSifDecrypted ? data.item.sifDecrypted : '');
    } else {
      setData('sifEditable', true);
      setData('revealSecureNote', true);
    }
  };

  const handleTextChange = e => {
    const newValue = e.target.value;
    const itemData = data.item.toJSON();
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isSifDecrypted) {
      updatedItem.setSifDecrypted(data.item.sifDecrypted);
    }

    updatedItem.internalData.editedSif = newValue;

    setData('item', updatedItem);
    form.change('editedSif', newValue);
  };

  const handleRevealToggle = () => {
    setData('revealSecureNote', !data?.revealSecureNote);
  };

  return (
    <LazyMotion features={loadDomAnimation}>
      <Field name='editedSif'>
        {() => (
          <div className={`${pI.passInput} ${!data?.sifEditable || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''} ${inputError === 'content.s_text' ? pI.error : ''}`}>
            <div className={pI.passInputTop}>
              <label htmlFor='editedSif'>{browser.i18n.getMessage('secure_note_note')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
                onClick={handleEditableClick}
                tabIndex={-1}
              >
                {data?.sifEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
              </button>
            </div>
            <div className={pI.passInputBottom}>
              {showTextarea ? (
                <textarea
                  ref={textareaRef}
                  value={getTextValue()}
                  placeholder={!sifDecryptError && (originalItem?.isT3orT2WithSif || data?.sifEditable) ? browser.i18n.getMessage('placeholder_secure_note_empty') : ''}
                  id='editedSif'
                  className={S.detailsSecureNoteTextarea}
                  disabled={!data?.sifEditable || sifDecryptError}
                  onChange={handleTextChange}
                  dir="ltr"
                  spellCheck="false"
                  autoCorrect="off"
                  autoComplete="off"
                  autoCapitalize="off"
                />
              ) : originalItem?.securityType === SECURITY_TIER.HIGHLY_SECRET && !originalItem?.sifExists ? null : (
                <input
                  type='password'
                  id='editedSif'
                  value='***************************************'
                  readOnly
                />
              )}

              {generateSecurityTypeTooltip(originalItem)}
              {generateErrorOverlay()}
            </div>
            {originalItem?.securityType === SECURITY_TIER.HIGHLY_SECRET && !originalItem?.sifExists ? null : (
              <div className={`${pI.passInputAdditional}`}>
                <div className={`${bS.passToggle} ${bS.loaded}`}>
                  <input
                    type="checkbox"
                    name="reveal-secure-note"
                    id="reveal-secure-note"
                    checked={data?.revealSecureNote || false}
                    disabled={data?.sifEditable || sifDecryptError}
                    onChange={handleRevealToggle}
                  />
                  <label htmlFor="reveal-secure-note">
                    <span className={bS.passToggleBox}>
                      <span className={bS.passToggleBoxCircle}></span>
                    </span>

                    <span className={bS.passToggleText}>
                      <span>{browser.i18n.getMessage('details_reveal_secure_note')}</span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </Field>
    </LazyMotion>
  );
}

export default SecureNoteText;
