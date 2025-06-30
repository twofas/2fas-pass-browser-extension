// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';

/** 
* Function to render the No Match component for Safari.
* @return {JSX.Element} The rendered component.
*/
const NoMatchSafari = () => {
  return (
    <div className={`${S.thisTabMatchingLoginsEmpty} ${S.active}`}>
      <div className='theme-light'>
        <img
          src={`${browser.runtime.getURL('/animations/box.svg')}`}
          alt="No Match"
          style={{ height: '86px', width: '120px' }}
          className='theme-light'
        />
      </div>
      <div className="theme-dark">
        <img
          src={`${browser.runtime.getURL('/animations/box-dark.svg')}`}
          alt="No Match"
          style={{ height: '86px', width: '120px' }}
          className='theme-dark'
        />
      </div>
    </div>
  );
};

export default NoMatchSafari;
