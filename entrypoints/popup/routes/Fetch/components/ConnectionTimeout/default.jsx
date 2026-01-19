// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';

/**
* Function to render the default connection timeout component.
* @return {JSX.Element} The rendered component.
*/
const ConnectionTimeoutDefault = () => {
  const [lightAnimationData, setLightAnimationData] = useState(null);
  const [darkAnimationData, setDarkAnimationData] = useState(null);

  useEffect(() => {
    const loadAnimations = async () => {
      const lightUrl = browser.runtime.getURL('/animations/clock.json');
      const darkUrl = browser.runtime.getURL('/animations/clock-dark.json');

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
    return <div style={{ height: '86px', width: '120px' }} />;
  }

  return (
    <>
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
    </>
  );
};

export default ConnectionTimeoutDefault;
