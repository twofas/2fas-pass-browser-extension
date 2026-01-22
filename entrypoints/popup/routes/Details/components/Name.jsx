// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import copyValue from '@/partials/functions/copyValue';
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../functions/updateItem';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

/** 
* Function to render the name input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Name (props) {
  const { getMessage } = useI18n();
  const { data, setData, setItem } = usePopupState();
  const inputRef = useRef(null);

  const { formData } = props;
  const { inputError } = formData;

  const isNameInvalid = useMemo(() => {
    const name = data?.item?.content?.name;

    if (!name || name.length === 0) {
      return false;
    }

    return name.length > 255;
  }, [data?.item?.content?.name]);

  const handleCopyName = useCallback(async name => {
    if (!name) {
      return;
    }

    await copyValue(name, data.item.deviceId, data.item.vaultId, data.item.id, 'name');
    showToast(getMessage('details_name_copied'), 'success');
  }, [data.item.id]);

  const handleNameEditable = async () => {
    if (data.nameEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        content: { name: item.content.name },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('nameEditable', false);
    } else {
      setData('nameEditable', true);
    }
  };

  const handleNameChange = useCallback(async e => {
    const newName = e.target.value;

    const updatedItem = await updateItem(data.item, {
      content: { name: newName },
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  }, [data.item, setItem]);

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
            <label htmlFor="name">{getMessage('name')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleNameEditable}
              tabIndex={-1}
            >
              {data.nameEditable ? getMessage('cancel') : getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              ref={inputRef}
              className={isNameInvalid ? pI.inputTextError : ''}
              onChange={e => {
                input.onChange(e);
                handleNameChange(e);
              }}
              placeholder={getMessage('placeholder_name')}
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
            title={getMessage('this_tab_copy_to_clipboard')}
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
