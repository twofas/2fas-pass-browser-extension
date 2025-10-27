// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import domainValidation from '@/partials/functions/domainValidation.jsx';
import { lazy, useCallback } from 'react';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import copyValue from '@/partials/functions/copyValue';
import usePopupStateStore from '../../../store/popupState';
import getItem from '@/partials/sessionStorage/getItem';
import Login from '@/partials/models/itemModels/Login';
import URIMatcher from '@/partials/URIMatcher';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));
const TrashIcon = lazy(() => import('@/assets/popup-window/trash.svg?react'));

const urlVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    overflow: 'hidden',
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: 24,
    overflow: 'visible',
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  }
};

/** 
* Function to render the URL input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function URLComponent (props) {
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const { inputError, uri, index } = props;

  const isEditable = data?.domainsEditable?.[uri._tempId];
  const buttonText = isEditable === true ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit');

  const handleCopyUri = useCallback(async index => {
    const uri = data?.item?.content?.uris && data?.item?.content?.uris?.[index] ? data.item.content.uris[index].text : '';
    await copyValue(uri, data.item.id, `uri-${index}`);
    showToast(browser.i18n.getMessage('notification_uri_copied'), 'success');
  }, [data.item]);

  const isNew = data.item.content.uris && data.item.content.uris[index] && data.item.content.uris[index].new;

  const handleUriEditable = async () => {
    const currentDomainsEditable = data?.domainsEditable || {};

    if (!currentDomainsEditable[uri._tempId]) {
      const newDomainsEditable = {
        ...currentDomainsEditable,
        [uri._tempId]: true
      };
      setData('domainsEditable', newDomainsEditable);
    } else {
      const item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const newUrisWithTempIds = [...data.item.internalData.urisWithTempIds];
      const newContentUris = [...data.item.content.uris];
      const currentUri = newUrisWithTempIds[index];

      if (item.internalData.urisWithTempIds && item.internalData.urisWithTempIds[index]) {
        newUrisWithTempIds[index] = {
          text: item.internalData.urisWithTempIds[index].text,
          matcher: item.internalData.urisWithTempIds[index].matcher,
          _tempId: currentUri._tempId
        };
        newContentUris[index] = {
          text: item.internalData.urisWithTempIds[index].text,
          matcher: item.internalData.urisWithTempIds[index].matcher
        };
      } else {
        newUrisWithTempIds[index] = {
          text: '',
          matcher: URIMatcher.M_DOMAIN_TYPE,
          _tempId: currentUri._tempId
        };
        newContentUris[index] = {
          text: '',
          matcher: URIMatcher.M_DOMAIN_TYPE
        };
      }

      const updatedItem = new Login({
        ...data.item,
        content: {
          ...data.item.content,
          uris: newContentUris
        },
        internalData: {
          ...data.item.internalData,
          urisWithTempIds: newUrisWithTempIds
        }
      });

      setData('item', updatedItem);

      const newDomainsEditable = {
        ...currentDomainsEditable,
        [uri._tempId]: false
      };
      setData('domainsEditable', newDomainsEditable);
    }
  };

  const handleRemoveUri = () => {
    const newUrisWithTempIds = [...data.item.internalData.urisWithTempIds];
    const newContentUris = [...data.item.content.uris];
    const removedUri = newUrisWithTempIds.find(u => u._tempId === uri._tempId);

    if (!removedUri) {
      return;
    }

    const removedIndex = newUrisWithTempIds.indexOf(removedUri);

    if (removedIndex > -1) {
      newUrisWithTempIds.splice(removedIndex, 1);
      newContentUris.splice(removedIndex, 1);
    }

    const newIconUriIndex = data.item.content.iconUriIndex > 0 ? data.item.content.iconUriIndex - 1 : 0;
    const updatedItem = new Login({
      ...data.item,
      content: {
        ...data.item.content,
        uris: newContentUris,
        iconUriIndex: newIconUriIndex
      },
      internalData: {
        ...data.item.internalData,
        urisWithTempIds: newUrisWithTempIds
      }
    });

    setData('item', updatedItem);

    if (data?.domainsEditable && data.domainsEditable[uri._tempId] !== undefined) {
      // eslint-disable-next-line no-unused-vars
      const { [uri._tempId]: _, ...remainingDomainsEditable } = data.domainsEditable;
      setData('domainsEditable', remainingDomainsEditable);
    }

    const currentUrisRemoved = data?.urisRemoved || 0;
    setData('urisRemoved', currentUrisRemoved + 1);
  };

  const handleUriChange = useCallback(e => {
    const newUri = e.target.value;
    const newUrisWithTempIds = [...data.item.internalData.urisWithTempIds];
    const newContentUris = [...data.item.content.uris];

    const uriToUpdate = newUrisWithTempIds.find(u => u._tempId === uri._tempId);

    if (!uriToUpdate) {
      return;
    }

    const uriIndex = newUrisWithTempIds.indexOf(uriToUpdate);

    if (uriIndex > -1) {
      newUrisWithTempIds[uriIndex] = { ...uriToUpdate, text: newUri };
      newContentUris[uriIndex] = { text: newUri, matcher: uriToUpdate.matcher };
    }

    const updatedItem = new Login({
      ...data.item,
      content: {
        ...data.item.content,
        uris: newContentUris
      },
      internalData: {
        ...data.item.internalData,
        urisWithTempIds: newUrisWithTempIds
      }
    });

    setData('item', updatedItem);
  });

  return (
    <LazyMotion features={loadDomAnimation}>
      <Field name={`content.uris[${index}].text`}>
        {({ input }) => (
          <m.div
            className={`${pI.passInput} ${data?.domainsEditable?.[uri._tempId] ? '' : pI.disabled} ${inputError === `uris[${index}]` ? pI.error : ''}`}
            variants={urlVariants}
            initial={isNew ? "hidden" : false}
            animate={isNew ? "visible" : false}
            exit="hidden"
          >
            <div className={pI.passInputTop}>
              <label htmlFor={`uri-${index}`}>{browser.i18n.getMessage('details_domain_uri').replace('URI_NUMBER', String(index + 1))}</label>
              <button type='button' className={`${bS.btn} ${bS.btnClear}`} onClick={handleUriEditable}>{buttonText}</button>
            </div>
            <div className={pI.passInputBottom}>
              <input
                type="text"
                {...input}
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
          </m.div>
        )}
      </Field>
    </LazyMotion>
  );
}

export default URLComponent;
