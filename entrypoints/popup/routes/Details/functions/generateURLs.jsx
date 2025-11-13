// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URLComponent from '../components/URLComponent';
import { lazy } from 'react';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import S from '../Details.module.scss';
import { AnimatePresence } from 'motion/react';
import usePopupStateStore from '../../../store/popupState';
import URIMatcher from '@/partials/URIMatcher';
import { v4 as uuidv4 } from 'uuid';

const AddIcon = lazy(() => import('@/assets/popup-window/add-new-2.svg?react'));

/** 
* Function to generate URLs.
* @param {Object} props - The component props.
* @return {JSX.Element|null} The generated URLs or null if not available.
*/
const generateURLs = props => {
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const { formData } = props;
  const { inputError } = formData;

  const handleAddUri = async () => {
    const newUriWithTempId = { text: '', matcher: URIMatcher.M_DOMAIN_TYPE, new: true, _tempId: uuidv4() };
    const newContentUri = { text: '', matcher: URIMatcher.M_DOMAIN_TYPE, new: true };

    const currentUrisWithTempIds = data.item.internalData.urisWithTempIds || [];
    const currentContentUris = data.item.content.uris || [];

    const newUrisWithTempIds = [...currentUrisWithTempIds, newUriWithTempId];
    const newContentUris = [...currentContentUris, newContentUri];

    const itemData = data.item.toJSON();
    itemData.content.uris = newContentUris;
    itemData.internalData = {
      ...data.item.internalData,
      urisWithTempIds: newUrisWithTempIds
    };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isSifDecrypted) {
      updatedItem.setSifDecrypted(data.item.sifDecrypted);
    }

    if (data.item.internalData.editedPassword !== null) {
      updatedItem.internalData.editedPassword = data.item.internalData.editedPassword;
    }

    setData('item', updatedItem);

    const currentDomainsEditable = data?.domainsEditable || {};
    setData('domainsEditable', {
      ...currentDomainsEditable,
      [newUriWithTempId._tempId]: true
    });
  };
  
  return (
    <>
      <AnimatePresence mode='popLayout'>
        {data?.item?.internalData?.urisWithTempIds?.length > 0 ? (
          data.item.internalData.urisWithTempIds.map((uri, index) => {
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
          <span>{data?.item?.internalData?.urisWithTempIds?.length > 0 ? browser.i18n.getMessage('details_add_another_domain') : browser.i18n.getMessage('details_add_domain')}</span>
        </button>
      </div>
    </>
  );
};

export default generateURLs;
