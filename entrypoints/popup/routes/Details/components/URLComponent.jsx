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

  const handleCopyUri = useCallback(async index => {
    const uri = data?.item?.content?.uris && data?.item?.content?.uris?.[index] ? data.item.content.uris[index].text : '';
    await copyValue(uri, data.item.id, `uri-${index}`);
    showToast(browser.i18n.getMessage('notification_uri_copied'), 'success');
  }, [data.item]);

  const isNew = data.item.content.uris && data.item.content.uris[index] && data.item.content.uris[index].new;

  const handleUriEditable = async () => {
    // @TODO: FIX!

    if (!data?.domainsEditable) {
      data.domainsEditable = {};
      setData('domainsEditable', data.domainsEditable);
    }

    if (!data?.domainsEditable[uri._tempId]) {
      const oldDomainsEditable = data?.domainsEditable;
      oldDomainsEditable[uri._tempId] = true;
      setData('domainsEditable', oldDomainsEditable);
    } else {
      const item = await getItem(data.item.id);
      const newUris = [...data.item.content.uris];

      if (item.content.uris && item.content.uris[index]) {
        newUris[index] = item.content.uris[index];
      } else {
        newUris[index] = { text: '', matcher: URIMatcher.M_DOMAIN_TYPE };
      }

      const updatedItem = new Login({ ...data.item, content: { ...data.item.content, uris: newUris } });
      setData('item', updatedItem);
      
      data.domainsEditable[uri._tempId] = false;
      setData('domainsEditable', data.domainsEditable);
    }
  };

  const handleRemoveUri = () => {
    const newUris = [...data.item.content.uris];
    const removedUri = newUris.find(u => u._tempId === uri._tempId);

    if (!removedUri) {
      return;
    }

    const removedIndex = newUris.indexOf(removedUri);

    if (removedIndex > -1) {
      newUris.splice(removedIndex, 1);
    }

    data.item.content.uris = newUris;
    data.item.content.iconUriIndex = data.item.content.iconUriIndex > 0 ? data.item.content.iconUriIndex - 1 : 0;

    setData('item', data.item);

    if (data?.domainsEditable && data.domainsEditable[uri._tempId] !== undefined) {
      delete data.domainsEditable[uri._tempId];
      setData('domainsEditable', data.domainsEditable);
    }

    if (!data?.urisRemoved) {
      data.urisRemoved = 0;
      setData('urisRemoved', data.urisRemoved);
    }

    data.urisRemoved++;
    setData('urisRemoved', data.urisRemoved);
  };

  const handleUriChange = useCallback(e => {
    const newUri = e.target.value;
    const newUris = [...data.item.content.uris];

    const uriToUpdate = newUris.find(u => u._tempId === uri._tempId);

    if (!uriToUpdate) {
      return;
    }

    const uriIndex = newUris.indexOf(uriToUpdate);

    if (uriIndex > -1) {
      newUris[uriIndex] = { ...uriToUpdate, text: newUri };
    }

    const updatedItem = new Login({ ...data.item, content: { ...data.item.content, uris: newUris } });
    setData('item', updatedItem);
  });

  return (
    <LazyMotion features={loadDomAnimation}>
      <Field name={`content.uris[${index}].text`}>
        {({ input }) => (
          <m.div
            className={`${pI.passInput} ${data?.domainsEditable?.[uri._tempId] ? '' : pI.disabled} ${inputError === `uris[${index}]` ? pI.error : ''}`}
            key={index}
            variants={urlVariants}
            initial={isNew ? "hidden" : "visible"}
            animate="visible"
            exit="hidden"
            layout
          >
            <div className={pI.passInputTop}>
              <label htmlFor={`uri-${index}`}>{browser.i18n.getMessage('details_domain_uri').replace('URI_NUMBER', String(index + 1))}</label>
              <button type='button' className={`${bS.btn} ${bS.btnClear}`} onClick={handleUriEditable}>{data?.domainsEditable?.[uri._tempId] === true ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}</button>
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
