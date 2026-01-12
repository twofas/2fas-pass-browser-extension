// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { memo } from 'react';

/**
 * Fallback component for lazy-loaded SVG icons to prevent layout shift.
 * @param {Object} props - Component props.
 * @param {number} props.size - Icon size in pixels (default: 16).
 * @param {string} props.className - Optional CSS class name.
 * @return {JSX.Element} The rendered component.
 */
function IconFallback ({ size = 16, className = '' }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`
      }}
      aria-hidden="true"
    />
  );
}

export default memo(IconFallback);
