// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Details.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useState, useCallback, useMemo } from 'react';
import { animate } from 'motion/react';
import { useEffect, useRef } from 'react';
import { isText } from '@/partials/functions';
import usePopupState from '../../../store/popupState/usePopupState';
import SecureNote from '@/models/itemModels/SecureNote';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

 /**
* Function to render the Secure Note text input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const TEXTAREA_LINE_HEIGHT = 19;

function SecureNoteText (props) {
  const { getMessage } = useI18n();
  const { sifDecryptError, formData } = props;
  const { form, originalItem, inputError } = formData;

  const { data, setData, setBatchData, setItem } = usePopupState();

  const previousSifValueRef = useRef(null);
  const textareaRef = useRef(null);
  const [showTextarea, setShowTextarea] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(0);
  const [textareaOverflow, setTextareaOverflow] = useState('hidden');
  const [localDecryptedText, setLocalDecryptedText] = useState(null);
  const [localEditedText, setLocalEditedText] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const itemInstance = useMemo(() => {
    if (!data.item) {
      return null;
    }

    if (data.item instanceof SecureNote) {
      return data.item;
    }

    try {
      return new SecureNote(data.item);
    } catch (e) {
      CatchError(e);
      return null;
    }
  }, [data.item]);

  const decryptTextOnDemand = useCallback(async () => {
    if (localDecryptedText !== null || isDecrypting || sifDecryptError) {
      return localDecryptedText;
    }

    if (!itemInstance?.sifExists) {
      return null;
    }

    setIsDecrypting(true);

    try {
      const decryptedData = await itemInstance.decryptSif();
      setLocalDecryptedText(decryptedData.text);
      setData('sifDecryptError', false);
      return decryptedData.text;
    } catch (e) {
      setData('sifDecryptError', true);
      CatchError(e);
      return null;
    } finally {
      setIsDecrypting(false);
    }
  }, [localDecryptedText, isDecrypting, sifDecryptError, itemInstance, setData]);

  const getTextValue = () => {
    if (sifDecryptError) {
      return '';
    }

    if (isText(localEditedText)) {
      return localEditedText;
    }

    if (isText(localDecryptedText)) {
      return localDecryptedText;
    }

    return '';
  };

  useEffect(() => {
    const currentTextValue = getTextValue();

    if (currentTextValue !== previousSifValueRef.current) {
      form.change('editedSif', currentTextValue);
      previousSifValueRef.current = currentTextValue;
    }
  }, [localEditedText, localDecryptedText, sifDecryptError, form]);

  useEffect(() => {
    const needsDecryption = (data?.sifEditable || data?.revealSecureNote) &&
                           localDecryptedText === null &&
                           !isDecrypting &&
                           itemInstance?.sifExists;

    if (needsDecryption) {
      decryptTextOnDemand();
    }
  }, [data?.sifEditable, data?.revealSecureNote, localDecryptedText, isDecrypting, itemInstance?.sifExists, decryptTextOnDemand]);

  useEffect(() => {
    if (data?.revealSecureNote) {
      const animateExpand = async () => {
        setTextareaHeight(0);
        setTextareaOverflow('hidden');
        setShowTextarea(true);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!textareaRef.current) {
              return;
            }

            const scrollHeight = textareaRef.current.scrollHeight;
            const targetHeight = Math.max(TEXTAREA_LINE_HEIGHT, Math.min(scrollHeight, 200));

            animate(0, targetHeight, {
              duration: 0.2,
              ease: 'easeOut',
              onUpdate: value => {
                setTextareaHeight(value);
              },
            }).then(() => {
              setTextareaOverflow('auto');

              if (data?.sifEditable && textareaRef.current) {
                const textarea = textareaRef.current;
                textarea.focus();

                requestAnimationFrame(() => {
                  textarea.setSelectionRange(0, 0);
                  textarea.scrollTop = 0;
                });
              }
            });
          });
        });
      };

      animateExpand();
    } else if (!data?.revealSecureNote && showTextarea) {
      const animateCollapse = async () => {
        if (!textareaRef.current) {
          return;
        }

        const currentHeight = textareaRef.current.offsetHeight;

        setTextareaOverflow('hidden');

        await animate(currentHeight, 0, {
          duration: 0.2,
          ease: 'easeOut',
          onUpdate: value => {
            setTextareaHeight(value);
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
        <span>{getMessage('details_secure_note_decrypt_error')}</span>
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
        <span>{getMessage('details_sif_not_fetched')}</span>
      </div>
    );
  };

  const handleEditableClick = async () => {
    if (data?.sifEditable) {
      setLocalEditedText(null);
      setBatchData({
        sifEdited: false,
        sifEditable: false,
        revealSecureNote: false
      });
      form.change('editedSif', isText(localDecryptedText) ? localDecryptedText : '');
    } else {
      await decryptTextOnDemand();
      setBatchData({
        sifEditable: true,
        revealSecureNote: true
      });
    }
  };

  const handleTextChange = async e => {
    const newValue = e.target.value;

    setLocalEditedText(newValue);
    form.change('editedSif', newValue);
    setData('editedSif', newValue);

    const itemData = typeof data.item.toJSON === 'function' ? data.item.toJSON() : data.item;
    const localItem = new SecureNote(itemData);
    await localItem.setSif([{ s_text: newValue }]);
    setItem(localItem);
  };

  const handleRevealToggle = async () => {
    if (!data?.revealSecureNote) {
      await decryptTextOnDemand();
    }

    setData('revealSecureNote', !data?.revealSecureNote);
  };

  return (
    <Field name='editedSif'>
      {() => (
          <div className={`${pI.passInput} ${!data?.sifEditable || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''} ${inputError === 'content.s_text' ? pI.error : ''}`}>
            <div className={pI.passInputTop}>
              <label htmlFor='editedSif'>{getMessage('secure_note_note')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
                onClick={handleEditableClick}
                tabIndex={-1}
              >
                {data?.sifEditable ? getMessage('cancel') : getMessage('edit')}
              </button>
            </div>
            <div className={pI.passInputBottom}>
              {showTextarea ? (
                <textarea
                  ref={textareaRef}
                  value={getTextValue()}
                  placeholder={!sifDecryptError && (originalItem?.isT3orT2WithSif || data?.sifEditable) ? getMessage('placeholder_secure_note_empty') : ''}
                  id='editedSif'
                  className={S.detailsSecureNoteTextarea}
                  style={{ height: `${textareaHeight}px`, overflowY: textareaOverflow }}
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
                      <span>{getMessage('details_reveal_secure_note')}</span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </Field>
  );
}

export default SecureNoteText;
