// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useCallback, useEffect, useRef } from 'react';
import copyValue from '@/partials/functions/copyValue';
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../functions/updateItem';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';

/** 
* Function to render the name input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Name (props) {
  const { data, setData, setBatchData } = usePopupState();
  const inputRef = useRef(null);

  const { formData } = props;
  const { inputError } = formData;

  const handleCopyName = useCallback(async name => {
    if (!name) {
      return;
    }

    await copyValue(name, data.item.deviceId, data.item.vaultId, data.item.id, 'name');
    showToast(browser.i18n.getMessage('details_name_copied'), 'success');
  }, [data.item.id]);

  const handleNameEditable = async () => {
    if (data.nameEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = updateItem(data.item, {
        content: { name: item.content.name },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setBatchData({
        nameEditable: false,
        item: updatedItem
      });
    } else {
      setData('nameEditable', true);
    }
  };

  const handleNameChange = useCallback(e => {
    const newName = e.target.value;

    const updatedItem = updateItem(data.item, {
      content: { name: newName },
      internalData: { ...data.item.internalData }
    });

    setData('item', updatedItem);
  }, [data.item, setData]);

  useEffect(() => {
    if (data.nameEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [data.nameEditable]);

  return (
    <Field name="content.name">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.nameEditable ? '' : pI.disabled} ${inputError === 'name' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor="name">{browser.i18n.getMessage('name')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleNameEditable}
              tabIndex={-1}
            >
              {data.nameEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              ref={inputRef}
              onChange={e => {
                input.onChange(e);
                handleNameChange(e);
              }}
              placeholder={browser.i18n.getMessage('placeholder_name')}
              id="name"
              disabled={!data.nameEditable ? 'disabled' : ''}
              dir="ltr"
              spellCheck="false"
              autoCorrect="off"
              autoComplete="off"
              autoCapitalize="off"
            />
          <button
            type='button'
            className={`${bS.btn} ${pI.iconButton}`}
            onClick={() => handleCopyName(input.value)}
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

export default Name;
