// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';

/**
* Function to render the No Match component for Safari.
* Safari uses static SVG images instead of Lottie animations.
* @param {Object} props - The component props.
* @param {Function} props.onAnimationReady - Callback when ready (not used in Safari as it uses static images).
* @return {JSX.Element} The rendered component.
*/
// eslint-disable-next-line no-unused-vars
const NoMatchSafari = ({ onAnimationReady }) => {
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
