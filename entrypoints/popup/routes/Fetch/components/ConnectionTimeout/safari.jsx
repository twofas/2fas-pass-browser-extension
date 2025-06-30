// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to render the Safari connection timeout component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ConnectionTimeoutSafari = () => {
  return (
    <>
      <div className='theme-light'>
        <img
          src={`${browser.runtime.getURL('/animations/clock.svg')}`}
          alt=''
          style={{ height: '86px', width: '120px' }}
          className='theme-light'
        />
      </div>
      <div className="theme-dark">
        <img
          src={`${browser.runtime.getURL('/animations/clock-dark.svg')}`}
          alt=''
          style={{ height: '86px', width: '120px' }}
          className='theme-dark'
        />
      </div>
    </>
  );
};

export default ConnectionTimeoutSafari;
