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
import usePopupStateStore from '../../../store/popupState';
import getItem from '@/partials/sessionStorage/getItem';
import { useCallback } from 'react';

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
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const { formData } = props;
  const { form } = formData;

  const handleNotesEditable = async () => {
    if (data.notesEditable) {
      let item = await getItem(data.item.id);
      data.item.content.notes = item?.content?.notes || '';
      item = null;

      setData('item', data.item);
      setData('notesEditable', false);
    } else {
      setData('notesEditable', true);
    }
  };

  const handleNotesChange = useCallback(e => {
    const newNotes = e.target.value;
    data.item.content.notes = newNotes;

    setData('item', data.item);
    form.change('content.notes', newNotes);
  }, [data.item, setData]);

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
            >
              {data.notesEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottomMotion}>
            <LazyMotion features={loadDomAnimation}>
              <m.div
                className={`${pI.passInputBottom} ${pI.note} ${data.notesEditable ? pI.noteEditable : ''}`}
                variants={notesVariants}
                initial="hidden"
                transition={{ duration: 0.3 }}
                animate={input.value.length > 0 || data.notesEditable ? 'visible' : 'hidden'}
              >
                <textarea
                  {...input}
                  onChange={e => {
                    input.onChange(e);
                    handleNotesChange(e);
                  }}
                  placeholder='Notes are empty'
                  id="notes"
                  disabled={!data.notesEditable ? 'disabled' : ''}
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
