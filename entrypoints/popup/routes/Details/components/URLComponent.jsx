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
  const { data, actions, index } = props;
  const { service, domainsEditable, inputError, form, uris } = data;
  const { setDomainsEditable, handleRemoveUri } = actions;
  
  const handleCopyUri = useCallback(async uri => {
    if (!uri) return;
    await copyValue(uri, service.id, 'uri');
    showToast(browser.i18n.getMessage('notification_uri_copied'), 'success');
  }, [service.id]);
  
  const isNew = uris && uris[index] && uris[index]._tempId;

  const setDomainEditable = index => {
    const newDomainsEditable = [...domainsEditable];

    if (newDomainsEditable[index]) {
      const originalValue = service.uris && service.uris[index] ? service.uris[index].text : '';
      form.change(`uris[${index}].text`, originalValue);
    }

    newDomainsEditable[index] = !newDomainsEditable[index];
    setDomainsEditable(newDomainsEditable);
  };

  return (
    <LazyMotion features={loadDomAnimation}>
      <Field name={`uris[${index}].text`}>
        {({ input }) => (
          <m.div 
            className={`${pI.passInput} ${domainsEditable[index] ? '' : pI.disabled} ${inputError === `uris[${index}]` ? pI.error : ''}`} 
            key={index}
            variants={urlVariants}
            initial={isNew ? "hidden" : "visible"}
            animate="visible"
            exit="hidden"
            layout
          >
            <div className={pI.passInputTop}>
            <label htmlFor={`uri-${index}`}>{browser.i18n.getMessage('details_domain_uri').replace('URI_NUMBER', String(index + 1))}</label>
            <button type='button' className={`${bS.btn} ${bS.btnClear}`} onClick={() => setDomainEditable(index)}>{domainsEditable[index] ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}</button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              placeholder={browser.i18n.getMessage('placeholder_domain_uri')}
              {...input}
              id={`uri-${index}`}
              disabled={!domainsEditable[index] ? 'disabled' : ''}
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
                onClick={() => handleCopyUri(input.value)}
                title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
              >
                <CopyIcon />
              </button>
              <button
                type='button'
                className={`${bS.btn} ${pI.iconButton} ${pI.trashButton} ${domainsEditable[index] ? '' : pI.hiddenButton}`}
                onClick={() => handleRemoveUri(index, form)}
                title={browser.i18n.getMessage('remove')}
                disabled={!domainsEditable[index]}
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
