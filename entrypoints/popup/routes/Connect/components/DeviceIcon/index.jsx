// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { memo } from 'react';
import IphoneIconLight from '@/assets/popup-window/device-select/device-iphone-light.svg?react';
import IphoneIconDark from '@/assets/popup-window/device-select/device-iphone-dark.svg?react';
import AndroidIconLight from '@/assets/popup-window/device-select/device-android-light.svg?react';
import AndroidIconDark from '@/assets/popup-window/device-select/device-android-dark.svg?react';
import IpadIconLight from '@/assets/popup-window/device-select/device-ipad-light.svg?react';
import IpadIconDark from '@/assets/popup-window/device-select/device-ipad-dark.svg?react';
import AndroidTabletIconLight from '@/assets/popup-window/device-select/device-android-tablet-light.svg?react';
import AndroidTabletIconDark from '@/assets/popup-window/device-select/device-android-tablet-dark.svg?react';

/**
 * Renders platform- and type-specific device icon for light and dark themes.
 * @param {Object} props - Component props.
 * @param {Object} props.device - Device object.
 * @param {string} [props.device.platform] - Device platform ('ios' or 'android').
 * @param {string} [props.device.type] - Device type (e.g. 'tablet').
 * @returns {JSX.Element|null} Rendered device icon or null for unknown platform.
 */
function DeviceIcon (props) {
  const platform = props.device?.platform || 'unknown';
  const deviceType = props.device?.type || 'unknown';

  switch (platform) {
    case 'ios': {
      if (deviceType === 'tablet') {
        return (
          <>
            <IpadIconLight className='theme-light' />
            <IpadIconDark className='theme-dark' />
          </>
        );
      }

      return (
        <>
          <IphoneIconLight className='theme-light' />
          <IphoneIconDark className='theme-dark' />
        </>
      );
    }

    case 'android': {
      if (deviceType === 'tablet') {
        return (
          <>
            <AndroidTabletIconLight className='theme-light' />
            <AndroidTabletIconDark className='theme-dark' />
          </>
        );
      }

      return (
        <>
          <AndroidIconLight className='theme-light' />
          <AndroidIconDark className='theme-dark' />
        </>
      );
    }

    default: {
      return null;
    }
  }
}

export default memo(DeviceIcon);
