// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { lazy, useCallback, useEffect, useRef } from 'react';
import copyValue from '@/partials/functions/copyValue';
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../functions/updateItem';

const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));

/** 
* Function to render the cardholder input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function CardHolder (props) {
  const { data, setData, setBatchData } = usePopupState();
  const inputRef = useRef(null);

  const { formData } = props;
  const { inputError } = formData;

  const handleCopyCardholder = useCallback(async cardholder => {
    if (!cardholder) {
      return;
    }

    await copyValue(cardholder, data.item.deviceId, data.item.vaultId, data.item.id, 'cardHolder');
    showToast(browser.i18n.getMessage('details_cardholder_copied'), 'success');
  }, [data.item.id]);

  const handleCardholderEditable = async () => {
    if (data.cardHolderEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = updateItem(data.item, {
        content: { cardHolder: item.content.cardHolder },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setBatchData({
        cardHolderEditable: false,
        item: updatedItem
      });
    } else {
      setData('cardHolderEditable', true);
    }
  };

  const handleCardholderChange = useCallback(e => {
    const newCardHolder = e.target.value;

    const updatedItem = updateItem(data.item, {
      content: { cardHolder: newCardHolder },
      internalData: { ...data.item.internalData }
    });

    setData('item', updatedItem);
  }, [data.item, setData]);

  useEffect(() => {
    if (data.cardHolderEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [data.cardHolderEditable]);

  return (
    <Field name="content.cardHolder">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.cardHolderEditable ? '' : pI.disabled} ${inputError === 'cardHolder' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor="cardHolder">{browser.i18n.getMessage('payment_card_cardholder')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleCardholderEditable}
              tabIndex={-1}
            >
              {data.cardHolderEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type='text'
              {...input}
              ref={inputRef}
              onChange={e => {
                input.onChange(e);
                handleCardholderChange(e);
              }}
              placeholder={browser.i18n.getMessage('placeholder_payment_card_cardholder')}
              id='cardHolder'
              disabled={!data.cardHolderEditable ? 'disabled' : ''}
              dir='ltr'
              spellCheck='true'
              autoCorrect='true'
              autoComplete='true'
              autoCapitalize='off'
            />
          <button
            type='button'
            className={`${bS.btn} ${pI.iconButton}`}
            onClick={() => handleCopyCardholder(input.value)}
            title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
            tabIndex={-1}
          >
            <CopyIcon />
          </button>
        </div>
      </div>
      )}
    </Field>
  );
}

export default CardHolder;
