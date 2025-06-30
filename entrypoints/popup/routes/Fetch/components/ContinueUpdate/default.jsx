// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Player } from '@lottiefiles/react-lottie-player';

/**
* Function to render the default continue update component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ContinueUpdateDefault = () => {
  return (
    <>
      <div className='theme-light'>
        <Player
          autoplay={true}
          loop={true}
          keepLastFrame={true}
          src={`${browser.runtime.getURL('/animations/push-2.json')}`}
          style={{ height: '86px', width: '120px' }}
        />
      </div>
      <div className="theme-dark">
        <Player
          autoplay={true}
          loop={true}
          keepLastFrame={true}
          src={`${browser.runtime.getURL('/animations/push-2-dark.json')}`}
          style={{ height: '86px', width: '120px' }}
        />
      </div>
    </>
  );
};

export default ContinueUpdateDefault;
