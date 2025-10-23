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
import Login from '@/partials/models/itemModels/Login';
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
    const newUri = { text: '', matcher: URIMatcher.M_DOMAIN_TYPE, new: true, _tempId: uuidv4() };
    data.item.content.uris = data.item.content.uris || [];
    data.item.content.uris.push(newUri);

    setData('item', data.item);

    if (!data?.domainsEditable) {
      data.domainsEditable = {};
      setData('domainsEditable', data.domainsEditable);
    }

    data.domainsEditable[newUri._tempId] = true;
    setData('domainsEditable', data.domainsEditable);
  };
  
  return (
    <>
      <AnimatePresence mode='popLayout'>
        {data?.item?.content?.uris?.length > 0 ? (
          data.item.content.uris.map((uri, index) => {
            const key = `uri-${data.item.id}-${index}`;

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
          <span>{data?.item?.content?.uris?.length > 0 ? browser.i18n.getMessage('details_add_another_domain') : browser.i18n.getMessage('details_add_domain')}</span>
        </button>
      </div>
    </>
  );
};

export default generateURLs;
