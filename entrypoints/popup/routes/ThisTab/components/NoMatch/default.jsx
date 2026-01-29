// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';

/**
* Function to render the No Match component for default browsers.
* @param {Object} props - The component props.
* @param {Function} props.onAnimationReady - Callback when the animation is ready to play (unused, kept for API compatibility).
* @return {JSX.Element} The rendered component.
*/
// eslint-disable-next-line no-unused-vars
const NoMatchDefault = ({ onAnimationReady }) => {
  const [lightAnimationData, setLightAnimationData] = useState(null);
  const [darkAnimationData, setDarkAnimationData] = useState(null);

  useEffect(() => {
    const loadAnimations = async () => {
      const lightUrl = browser.runtime.getURL('/animations/box.json');
      const darkUrl = browser.runtime.getURL('/animations/box-dark.json');

      const [lightResponse, darkResponse] = await Promise.all([
        fetch(lightUrl),
        fetch(darkUrl)
      ]);

      const [lightData, darkData] = await Promise.all([
        lightResponse.json(),
        darkResponse.json()
      ]);

      setLightAnimationData(lightData);
      setDarkAnimationData(darkData);
    };

    loadAnimations();
  }, []);

  if (!lightAnimationData || !darkAnimationData) {
    return (
      <div className={`${S.thisTabMatchingLoginsEmpty} ${S.active}`}>
        <div style={{ height: '86px', width: '120px' }} />
      </div>
    );
  }

  return (
    <div className={`${S.thisTabMatchingLoginsEmpty} ${S.active}`}>
      <div className='theme-light'>
        <Lottie
          animationData={lightAnimationData}
          autoplay={true}
          loop={false}
          style={{ height: '86px', width: '120px' }}
        />
      </div>
      <div className="theme-dark">
        <Lottie
          animationData={darkAnimationData}
          autoplay={true}
          loop={false}
          style={{ height: '86px', width: '120px' }}
        />
      </div>
    </div>
  );
};

export default NoMatchDefault;
