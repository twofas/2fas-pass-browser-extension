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
import updateItem from '../functions/updateItem';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

const additionalInfoVariants = {
  hidden: { height: 'auto', minHeight: '20px', maxHeight: '600px' },
  visible: { height: '121px', minHeight: '121px', maxHeight: '600px' }
};

/**
* Function to render the additional info input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AdditionalInfo (props) {
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);
  const setBatchData = usePopupStateStore(state => state.setBatchData);

  const { formData } = props;
  const { inputError } = formData;

  const handleAdditionalInfoEditable = async () => {
    if (data.additionalInfoEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);
      
      const updatedItem = updateItem(data.item, {
        content: { additionalInfo: item.content.additionalInfo || '' },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setBatchData({
        item: updatedItem,
        additionalInfoEditable: false
      });
    } else {
      setData('additionalInfoEditable', true);
    }
  };

  const handleAdditionalInfoChange = useCallback(e => {
    const newAdditionalInfo = e.target.value;

    const updatedItem = updateItem(data.item, {
      content: { additionalInfo: newAdditionalInfo },
      internalData: { ...data.item.internalData }
    });

    setData('item', updatedItem);
  }, [data.item, setData]);

  return (
    <Field name="content.additionalInfo">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.additionalInfoEditable ? pI.resizable : pI.disabled} ${inputError === 'content.additionalInfo' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <div className={pI.passInputTopLabelLike}>
              <span>{browser.i18n.getMessage('details_additional_info')}</span>
            </div>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleAdditionalInfoEditable}
              tabIndex={-1}
            >
              {data.additionalInfoEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottomMotion}>
            <LazyMotion features={loadDomAnimation}>
              <m.div
                className={`${pI.passInputBottom} ${pI.note} ${data.additionalInfoEditable ? pI.noteEditable : ''}`}
                variants={additionalInfoVariants}
                initial="hidden"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                animate={input.value.length > 0 || data.additionalInfoEditable ? 'visible' : 'hidden'}
              >
                <textarea
                  {...input}
                  onChange={e => {
                    input.onChange(e);
                    handleAdditionalInfoChange(e);
                  }}
                  placeholder={browser.i18n.getMessage('details_additional_info_placeholder')}
                  id="additional-info"
                  disabled={!data.additionalInfoEditable ? 'disabled' : ''}
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

export default AdditionalInfo;
