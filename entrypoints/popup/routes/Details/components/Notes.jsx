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
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '121px' }
};

 /**
* Function to render the notes input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Notes (props) {
  const { data, actions } = props;
  const { service, notesEditable, notesVisible, form } = data;
  const { setNotesEditable, setNotesVisible } = actions;

  const handleNotesEditable = form => {
    setNotesEditable(!notesEditable);

    if (notesEditable) {
      form.change('notes', service.notes);
    } else {
      setNotesVisible(true);
    }
  };

  return (
    <Field name="notes">
      {({ input }) => (
        <div className={`${pI.passInput} ${notesEditable ? '' : pI.disabled}`}>
          <div className={pI.passInputTop}>
            <div className={pI.passInputTopLabelLike}>
              <div className={`${bS.passToggle} ${bS.loaded}`}>
                <input
                  type="checkbox"
                  name="notes"
                  id="notes"
                  onChange={() => setNotesVisible(!notesVisible)}
                  checked={notesVisible}
                />
                <label htmlFor="notes">
                  <span className={bS.passToggleBox}>
                    <span className={bS.passToggleBoxCircle}></span>
                  </span>
                </label>
              </div>
              <span>{browser.i18n.getMessage('notes')}</span>
            </div>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={() => handleNotesEditable(form)}
            >
              {notesEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={`${pI.passInputBottomMotion} ${!notesVisible ? pI.hidden : ''}`}>
            <LazyMotion features={loadDomAnimation}>
              <m.div
                className={pI.passInputBottom}
                variants={notesVariants}
                initial="hidden"
                transition={{ duration: 0.3 }}
                animate={notesVisible ? 'visible' : 'hidden'}
              >
                <textarea
                  {...input}
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
