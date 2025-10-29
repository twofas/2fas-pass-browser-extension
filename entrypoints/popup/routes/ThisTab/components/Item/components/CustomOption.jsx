// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Link } from 'react-router';
import { lazy } from 'react';
import handleUriCopyClick from '../../../functions/serviceList/handleUriCopyClick';
import handleUriClick from '../../../functions/serviceList/handleUriClick';
import handleForgetPassword from '../../../functions/serviceList/handleForgetPassword';
import usePopupStateStore from '@/entrypoints/popup/store/popupState';

const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));
const DetailsIcon = lazy(() => import('@/assets/popup-window/details.svg?react'));
const MoreUrlIcon = lazy(() => import('@/assets/popup-window/more-url.svg?react'));
const TrashIcon = lazy(() => import('@/assets/popup-window/trash.svg?react'));

/** 
* Function to render a custom option in the dropdown.
* @param {Object} option - The option data.
* @return {JSX.Element} The rendered custom option.
*/
const CustomOption = option => {
  const data = usePopupStateStore(state => state.data);
  const scrollPosition = usePopupStateStore(state => state.scrollPosition);

  switch (option?.data?.type) {
    case 'details': {
      return (
        <div className='react-select-dropdown__option details'>
          <Link
            to={`/details/${option.data.deviceId}/${option.data.vaultId}/${option.data.id}`}
            state={{
              from: 'thisTab',
              data: { ...data },
              scrollPosition
            }}
            className='react-select-dropdown__option--uri details'
            prefetch='intent'
          >
            <DetailsIcon />
            <span>{browser.i18n.getMessage('this_tab_more_details')}</span>
          </Link>
        </div>
      );
    }

    case 'forget': {
      return (
        <div className='react-select-dropdown__option forget'>
          <a
            href='#'
            className='react-select-dropdown__option--uri forget'
            onClick={async e => await handleForgetPassword(e, option.data.id, option.toggleMenu)}
          >
            <TrashIcon />
            <span>{option.data.label}</span>
          </a>
        </div>
      );
    }

    case 'urisHeader': {
      return (
        <div className='react-select-dropdown__option uris'>
          <span className='react-select-dropdown__option--uri uris'>
            {option.data.label}
          </span>
        </div>
      );
    }

    default: {
      return (
        <div className='react-select-dropdown__option uri'>
          <a
            href={option.data.value}
            target='_blank'
            rel='noreferrer noopener'
            className='react-select-dropdown__option--uri'
            title={option.data.value}
            onClick={e => handleUriClick(e, option)}
          >
            <MoreUrlIcon />
            <span>{option.data.label}</span>
          </a>
          <button
            className={`react-select-dropdown__option--copy ${option.data.value === 'details' || option.data.value === 'uris:' ? 'hidden' : ''}`}
            onClick={() => handleUriCopyClick(option)}
            title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
          >
            <CopyIcon />
          </button>
        </div>
      );
    }
  }
};

export default CustomOption;
