// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

const notesVariants = {
  hidden: { height: 'auto', minHeight: '20px', maxHeight: '600px' },
  visible: { height: '121px', minHeight: '121px', maxHeight: '600px' }
};

/**
* Function to render the notes input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Notes (props) {
  const { data, actions } = props;
  const { originalService, notesEditable, form } = data;
  const { setNotesEditable, clearNotesInPopupState } = actions;

  const handleNotesEditable = (form, input) => {
    if (notesEditable) {
      const valueToRestore = originalService?.notes || '';

      form.change('notes', valueToRestore);

      if (input) {
        input.onChange(valueToRestore);
      }

      setNotesEditable(false);

      if (clearNotesInPopupState) {
        const currentFormValues = form.getState().values;
        const updatedFormValues = { ...currentFormValues, notes: valueToRestore };
        clearNotesInPopupState(updatedFormValues);
      }
    } else {
      setNotesEditable(true);
    }
  };

  return (
    <Field name="notes">
      {({ input }) => (
        <div className={`${pI.passInput} ${notesEditable ? pI.resizable : pI.disabled}`}>
          <div className={pI.passInputTop}>
            <div className={pI.passInputTopLabelLike}>
              <span>{browser.i18n.getMessage('notes')}</span>
            </div>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={() => handleNotesEditable(form, input)}
            >
              {notesEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottomMotion}>
            <LazyMotion features={loadDomAnimation}>
              <m.div
                className={`${pI.passInputBottom} ${pI.note} ${notesEditable ? pI.noteEditable : ''}`}
                variants={notesVariants}
                initial="hidden"
                transition={{ duration: 0.3 }}
                animate={input.value.length > 0 || notesEditable ? 'visible' : 'hidden'}
              >
                <textarea
                  {...input}
                  placeholder='Notes are empty'
                  id="notes"
                  disabled={!notesEditable ? 'disabled' : ''}
                  dir="ltr"
                  spellCheck="true"
                  autoCorrect="off"
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </m.div>
            </LazyMotion>
          </div>
        </div>
      )}
    </Field>
  );
}

export default Notes;
