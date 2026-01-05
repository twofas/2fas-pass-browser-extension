// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URLComponent from '../components/URLComponent';
import { useCallback } from 'react';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import S from '../Details.module.scss';
import { AnimatePresence } from 'motion/react';
import usePopupState from '../../../store/popupState/usePopupState';
import URIMatcher from '@/partials/URIMatcher';
import { useUriTempIds } from '../context/UriTempIdsContext';
import updateItem from './updateItem';
import AddIcon from '@/assets/popup-window/add-new-2.svg?react';

/**
* Component to generate and manage URL inputs.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered URLs or empty state.
*/
function GenerateURLs (props) {
  const { data, setData, setItem } = usePopupState();
  const { urisWithTempIds, addUri } = useUriTempIds();

  const { formData } = props;
  const { inputError } = formData;

  const handleAddUri = useCallback(async () => {
    const newUri = addUri('', URIMatcher.M_DOMAIN_TYPE);

    const currentContentUris = data.item.content.uris || [];
    const newContentUris = [...currentContentUris, { text: '', matcher: URIMatcher.M_DOMAIN_TYPE, new: true }];

    const updatedItem = await updateItem(data.item, {
      content: { uris: newContentUris }
    });

    setItem(updatedItem);

    const currentDomainsEditable = data?.domainsEditable || {};
    const newDomainsEditable = {
      ...currentDomainsEditable,
      [newUri._tempId]: true
    };

    setData('domainsEditable', newDomainsEditable);
  }, [data.item, data?.domainsEditable, setData, setItem, addUri]);

  return (
    <>
      <AnimatePresence mode='popLayout'>
        {urisWithTempIds?.length > 0 ? (
          urisWithTempIds.map((uri, index) => {
            const key = `uri-${data.item.id}-${uri._tempId}`;

            return (
              <URLComponent
                key={key}
                index={index}
                inputError={inputError}
                uri={uri}
              />
            );
          })
        ) : (
          <div className={`${pI.passInput} ${pI.disabled}`}>
            <div className={pI.passInputTop}>
              <label>{browser.i18n.getMessage('details_no_domain_available')}</label>
            </div>
          </div>
        )}
      </AnimatePresence>
      <div className={S.detailsAddDomain}>
        <button
          type='button'
          className={`${bS.btn} ${bS.btnClear} ${bS.domainAdd}`}
          onClick={handleAddUri}
        >
          <AddIcon />
          <span>{urisWithTempIds?.length > 0 ? browser.i18n.getMessage('details_add_another_domain') : browser.i18n.getMessage('details_add_domain')}</span>
        </button>
      </div>
    </>
  );
}

export default GenerateURLs;
