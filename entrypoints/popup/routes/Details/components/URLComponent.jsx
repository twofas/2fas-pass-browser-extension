// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import domainValidation from '@/partials/functions/domainValidation.jsx';
import { lazy, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import copyValue from '@/partials/functions/copyValue';
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import URIMatcher from '@/partials/URIMatcher';
import updateItem from '../functions/updateItem';
import { useUriTempIds } from '../context/UriTempIdsContext';

const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));
const TrashIcon = lazy(() => import('@/assets/popup-window/trash.svg?react'));

const urlVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    overflow: 'hidden',
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: 24,
    overflow: 'visible',
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};

/**
* Component to render the URL input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function URLComponent (props) {
  const { data, setData } = usePopupState();
  const { urisWithTempIds, updateUri, removeUri, resetUri } = useUriTempIds();

  const { inputError, uri, index } = props;
  const inputRef = useRef(null);

  const isEditable = data?.domainsEditable?.[uri._tempId];
  const buttonText = isEditable === true ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit');
  const isNew = uri.new;

  const handleCopyUri = useCallback(async index => {
    const uriText = data?.item?.content?.uris && data?.item?.content?.uris?.[index] ? data.item.content.uris[index].text : '';
    await copyValue(uriText, data.item.deviceId, data.item.vaultId, data.item.id, 'uri');
    showToast(browser.i18n.getMessage('notification_uri_copied'), 'success');
  }, [data.item]);

  const handleUriEditable = async () => {
    const currentDomainsEditable = data?.domainsEditable || {};

    if (!currentDomainsEditable[uri._tempId]) {
      const newDomainsEditable = {
        ...currentDomainsEditable,
        [uri._tempId]: true
      };

      setData('domainsEditable', newDomainsEditable);
    } else {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const originalUri = item?.content?.uris?.[index];
      const newContentUris = [...data.item.content.uris];

      if (originalUri) {
        newContentUris[index] = {
          text: originalUri.text,
          matcher: originalUri.matcher
        };
        resetUri(uri._tempId, originalUri);
      } else {
        newContentUris[index] = {
          text: '',
          matcher: URIMatcher.M_DOMAIN_TYPE
        };
        resetUri(uri._tempId, { text: '', matcher: URIMatcher.M_DOMAIN_TYPE });
      }

      const updatedItem = updateItem(data.item, {
        content: { uris: newContentUris }
      });

      item = null;

      setData('item', updatedItem);

      const newDomainsEditable = {
        ...currentDomainsEditable,
        [uri._tempId]: false
      };

      setData('domainsEditable', newDomainsEditable);
    }
  };

  const handleRemoveUri = useCallback(() => {
    const uriIndex = urisWithTempIds.findIndex(u => u._tempId === uri._tempId);

    if (uriIndex === -1) {
      return;
    }

    const newContentUris = [...data.item.content.uris];
    newContentUris.splice(uriIndex, 1);

    const newIconUriIndex = data.item.content.iconUriIndex > 0 ? data.item.content.iconUriIndex - 1 : 0;

    const updatedItem = updateItem(data.item, {
      content: {
        uris: newContentUris,
        iconUriIndex: newIconUriIndex
      }
    });

    setData('item', updatedItem);
    removeUri(uri._tempId);

    if (data?.domainsEditable && data.domainsEditable[uri._tempId] !== undefined) {
      // eslint-disable-next-line no-unused-vars
      const { [uri._tempId]: _, ...remainingDomainsEditable } = data.domainsEditable;
      setData('domainsEditable', remainingDomainsEditable);
    }

    const currentUrisRemoved = data?.urisRemoved || 0;
    setData('urisRemoved', currentUrisRemoved + 1);
  }, [data, uri._tempId, setData, urisWithTempIds, removeUri]);

  const handleUriChange = useCallback(e => {
    const newUriText = e.target.value;

    const uriIndex = urisWithTempIds.findIndex(u => u._tempId === uri._tempId);

    if (uriIndex === -1) {
      return;
    }

    const currentUri = urisWithTempIds[uriIndex];
    const newContentUris = [...data.item.content.uris];
    newContentUris[uriIndex] = { text: newUriText, matcher: currentUri.matcher };

    const updatedItem = updateItem(data.item, {
      content: { uris: newContentUris }
    });

    setData('item', updatedItem);
    updateUri(uri._tempId, { text: newUriText });
  }, [data.item, setData, uri._tempId, urisWithTempIds, updateUri]);

  useEffect(() => {
    if (isEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditable]);

  return (
    <Field name={`content.uris[${index}].text`}>
      {({ input }) => (
        <motion.div
          className={`${pI.passInput} ${data?.domainsEditable?.[uri._tempId] ? '' : pI.disabled} ${inputError === `uris[${index}]` ? pI.error : ''}`}
          variants={urlVariants}
          initial={isNew ? 'hidden' : false}
          animate={isNew ? 'visible' : false}
          exit='hidden'
        >
            <div className={pI.passInputTop}>
              <label htmlFor={`uri-${index}`}>{browser.i18n.getMessage('details_domain_uri').replace('URI_NUMBER', String(index + 1))}</label>
              <button type='button' className={`${bS.btn} ${bS.btnClear}`} onClick={handleUriEditable} tabIndex={-1}>{buttonText}</button>
            </div>
            <div className={pI.passInputBottom}>
              <input
                type="text"
                {...input}
                ref={inputRef}
                value={uri.text}
                onChange={e => {
                  input.onChange(e);
                  handleUriChange(e);
                }}
                placeholder={browser.i18n.getMessage('placeholder_domain_uri')}
                id={`uri-${index}`}
                disabled={!data?.domainsEditable?.[uri._tempId] ? 'disabled' : ''}
                dir="ltr"
                spellCheck="false"
                autoCorrect="off"
                autoComplete="on"
                autoCapitalize="off"
              />
              <div className={pI.passInputBottomButtons}>
                <button
                  type='button'
                  className={`${bS.btn} ${pI.iconButton}`}
                  onClick={() => handleCopyUri(index)}
                  title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
                  tabIndex={-1}
                >
                  <CopyIcon />
                </button>
                <button
                  type='button'
                  className={`${bS.btn} ${pI.iconButton} ${pI.trashButton} ${data?.domainsEditable?.[uri._tempId] ? '' : pI.hiddenButton}`}
                  onClick={handleRemoveUri}
                  title={browser.i18n.getMessage('remove')}
                  disabled={!data?.domainsEditable?.[uri._tempId]}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
            <div className={`${pI.passInputAdditional} ${pI.noValidDomain}`}>
              {domainValidation(input.value)}
            </div>
          </motion.div>
        )}
      </Field>
  );
}

export default URLComponent;
