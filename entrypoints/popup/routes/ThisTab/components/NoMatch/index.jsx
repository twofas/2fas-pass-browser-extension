// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useRef, useEffect, useState } from 'react';

/**
* Function to render the No Match component.
* @param {Object} props - The component props.
* @param {number} props.matchingLoginsLength - The number of matching logins.
* @param {boolean} props.loading - Whether the component is loading.
* @param {Function} props.onAnimationReady - Callback when the animation is ready to play.
* @return {JSX.Element} The rendered component.
*/
const NoMatch = ({ matchingLoginsLength, loading, onAnimationReady }) => {
  const [loaded, setLoaded] = useState(false);
  const NoMatchComponent = useRef(null);

  useEffect(() => {
    if (import.meta.env.BROWSER === 'safari') {
      import('./safari.jsx').then(module => { NoMatchComponent.current = module.default; setLoaded(true); });
    } else {
      import('./default.jsx').then(module => { NoMatchComponent.current = module.default; setLoaded(true); });
    }
  }, []);

  if (matchingLoginsLength > 0 || loading) {
    return null;
  }

  if (!loaded) {
    return <div style={{ height: '86px' }} />;
  }

  return (
    <NoMatchComponent.current
      onAnimationReady={onAnimationReady}
    />
  );
};

export default NoMatch;
