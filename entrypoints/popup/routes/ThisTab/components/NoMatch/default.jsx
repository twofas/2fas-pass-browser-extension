// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import { Player } from '@lottiefiles/react-lottie-player';

/** 
* Function to render the No Match component for default browsers.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const NoMatchDefault = ({ boxAnimationRef, boxAnimationDarkRef }) => {
  return (
    <div className={`${S.thisTabMatchingLoginsEmpty} ${S.active}`}>
      <div className='theme-light'>
        <Player
          autoplay={false}
          loop={false}
          keepLastFrame={true}
          src={`${browser.runtime.getURL('/animations/box.json')}`}
          style={{ height: '86px', width: '120px' }}
          ref={boxAnimationRef}
        />
      </div>
      <div className="theme-dark">
        <Player
          autoplay={false}
          loop={false}
          keepLastFrame={true}
          src={`${browser.runtime.getURL('/animations/box-dark.json')}`}
          style={{ height: '86px', width: '120px' }}
          ref={boxAnimationDarkRef}
        />
      </div>
    </div>
  );
};

export default NoMatchDefault;
