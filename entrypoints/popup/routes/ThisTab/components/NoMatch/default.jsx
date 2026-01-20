// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import { Player } from '@lottiefiles/react-lottie-player';
import { useRef, useCallback } from 'react';

/**
* Function to render the No Match component for default browsers.
* @param {Object} props - The component props.
* @param {Function} props.onAnimationReady - Callback when the animation is ready to play.
* @return {JSX.Element} The rendered component.
*/
const NoMatchDefault = ({ onAnimationReady }) => {
  const boxAnimationRef = useRef(null);
  const boxAnimationDarkRef = useRef(null);
  const lightReady = useRef(false);
  const darkReady = useRef(false);

  const handleLightEvent = useCallback(event => {
    if (event === 'load' && !lightReady.current) {
      lightReady.current = true;

      if (darkReady.current && onAnimationReady) {
        onAnimationReady(boxAnimationRef, boxAnimationDarkRef);
      }
    }
  }, [onAnimationReady]);

  const handleDarkEvent = useCallback(event => {
    if (event === 'load' && !darkReady.current) {
      darkReady.current = true;

      if (lightReady.current && onAnimationReady) {
        onAnimationReady(boxAnimationRef, boxAnimationDarkRef);
      }
    }
  }, [onAnimationReady]);

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
          onEvent={handleLightEvent}
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
          onEvent={handleDarkEvent}
        />
      </div>
    </div>
  );
};

export default NoMatchDefault;
