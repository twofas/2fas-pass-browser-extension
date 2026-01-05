// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { motion } from 'motion/react';
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import { useCallback, useEffect, useRef } from 'react';
import updateItem from '../functions/updateItem';

const notesVariants = {
  hidden: { height: 'auto', minHeight: '20px', maxHeight: '600px' },
  visible: { height: '121px', minHeight: '121px', maxHeight: '600px' }
};

/**
* Function to render the notes input field.
* @return {JSX.Element} The rendered component.
*/
function Notes () {
  const { data, setData, setItem } = usePopupState();
  const textareaRef = useRef(null);

  const handleNotesEditable = async () => {
    if (data.notesEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        content: { notes: item.content.notes || '' },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('notesEditable', false);
    } else {
      setData('notesEditable', true);
    }
  };

  const handleNotesChange = useCallback(async e => {
    const newNotes = e.target.value;

    const updatedItem = await updateItem(data.item, {
      content: { notes: newNotes },
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  }, [data.item, setItem]);

  useEffect(() => {
    if (data.notesEditable && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();

      requestAnimationFrame(() => {
        textarea.setSelectionRange(0, 0);
        textarea.scrollTop = 0;
      });
    }
  }, [data.notesEditable]);

  return (
    <Field name="content.notes">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.notesEditable ? pI.resizable : pI.disabled}`}>
          <div className={pI.passInputTop}>
            <div className={pI.passInputTopLabelLike}>
              <span>{browser.i18n.getMessage('notes')}</span>
            </div>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleNotesEditable}
              tabIndex={-1}
            >
              {data.notesEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottomMotion}>
            <motion.div
              className={`${pI.passInputBottom} ${pI.note} ${data.notesEditable ? pI.noteEditable : ''}`}
              variants={notesVariants}
              initial="hidden"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              animate={input.value.length > 0 || data.notesEditable ? 'visible' : 'hidden'}
            >
              <textarea
                {...input}
                ref={textareaRef}
                onChange={e => {
                  input.onChange(e);
                  handleNotesChange(e);
                }}
                placeholder={browser.i18n.getMessage('details_notes_placeholder')}
                id="notes"
                disabled={!data.notesEditable ? 'disabled' : ''}
                dir="ltr"
                spellCheck="true"
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
              />
            </motion.div>
          </div>
        </div>
      )}
    </Field>
  );
}

export default Notes;
