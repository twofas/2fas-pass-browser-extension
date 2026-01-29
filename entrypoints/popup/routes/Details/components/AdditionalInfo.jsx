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
import { useCallback, useMemo } from 'react';
import updateItem from '../functions/updateItem';
import { useI18n } from '@/partials/context/I18nContext';


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
  const { getMessage } = useI18n();
  const { data, setData, setItem } = usePopupState();

  const { formData } = props;
  const { inputError } = formData;

  const isAdditionalInfoInvalid = useMemo(() => {
    const info = data?.item?.content?.additionalInfo;

    if (!info || info.length === 0) {
      return false;
    }

    return info.length > 16384;
  }, [data?.item?.content?.additionalInfo]);

  const handleAdditionalInfoEditable = async () => {
    if (data.additionalInfoEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        content: { additionalInfo: item.content.additionalInfo || '' },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('additionalInfoEditable', false);
    } else {
      setData('additionalInfoEditable', true);
    }
  };

  const handleAdditionalInfoChange = useCallback(async e => {
    const newAdditionalInfo = e.target.value;

    const updatedItem = await updateItem(data.item, {
      content: { additionalInfo: newAdditionalInfo },
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  }, [data.item, setItem]);

  return (
    <Field name="content.additionalInfo">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.additionalInfoEditable ? pI.resizable : pI.disabled} ${inputError === 'content.additionalInfo' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <div className={pI.passInputTopLabelLike}>
              <span>{getMessage('details_additional_info')}</span>
            </div>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleAdditionalInfoEditable}
              tabIndex={-1}
            >
              {data.additionalInfoEditable ? getMessage('cancel') : getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottomMotion}>
            <motion.div
              className={`${pI.passInputBottom} ${pI.note} ${data.additionalInfoEditable ? pI.noteEditable : ''}`}
              variants={additionalInfoVariants}
              initial="hidden"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              animate={input.value.length > 0 || data.additionalInfoEditable ? 'visible' : 'hidden'}
            >
              <textarea
                {...input}
                className={isAdditionalInfoInvalid ? pI.inputTextError : ''}
                onChange={e => {
                  input.onChange(e);
                  handleAdditionalInfoChange(e);
                }}
                placeholder={getMessage('details_additional_info_placeholder')}
                id="additional-info"
                disabled={!data.additionalInfoEditable ? 'disabled' : ''}
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

export default AdditionalInfo;
