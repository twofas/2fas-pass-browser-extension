// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to render the Safari continue update component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ContinueUpdateSafari = () => {
  return (
    <>
      <div className='theme-light'>
        <img
          src={`${browser.runtime.getURL('/animations/push-2.svg')}`}
          alt=''
          style={{ height: '86px', width: '120px' }}
          className='theme-light'
        />
      </div>
      <div className="theme-dark">
        <img
          src={`${browser.runtime.getURL('/animations/push-2-dark.svg')}`}
          alt=''
          style={{ height: '86px', width: '120px' }}
          className='theme-dark'
        />
      </div>
    </>
  );
};

export default ContinueUpdateSafari;
