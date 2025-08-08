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

const AddIcon = lazy(() => import('@/assets/popup-window/add-new-2.svg?react'));

/** 
* Function to generate URLs.
* @param {Object} props - The component props.
* @return {JSX.Element|null} The generated URLs or null if not available.
*/
const generateURLs = props => {
  const { data, actions } = props;
  const { uris = [], form } = data;
  const { handleAddUri } = actions;

  return (
    <>
      <AnimatePresence mode="popLayout">
        {uris.length > 0 ? (
          uris.map((uri, index) => {
            const key = uri._tempId || `uri-${uri.text}-${index}`;
            return (
              <URLComponent
                key={key}
                index={index}
                data={data}
                actions={actions}
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
          onClick={() => handleAddUri(form)}
        >
          <AddIcon />
          <span>{uris.length > 0 ? browser.i18n.getMessage('details_add_another_domain') : browser.i18n.getMessage('details_add_domain')}</span>
        </button>
      </div>
    </>
  );
};

export default generateURLs;
