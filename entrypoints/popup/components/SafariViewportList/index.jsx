// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { ViewportList } from 'react-viewport-list';
import { useEffect, useRef, useMemo } from 'react';
import styles from './SafariViewportList.module.scss';

/**
 * Safari-optimized wrapper for ViewportList that addresses scrolling glitches
 * @param {Array} items - Array of items to render
 * @param {Function} children - Render function for each item
 * @param {number} overscan - Number of items to render outside viewport
 * @param {string} className - Optional className for the wrapper
 * @returns {JSX.Element} Safari-optimized viewport list
 */
const SafariViewportList = ({ items, children, overscan = 10, className }) => {
  const containerRef = useRef(null);
  const isSafari = useMemo(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('safari') && !userAgent.includes('chrome');
  }, []);

  useEffect(() => {
    if (!isSafari || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    container.style.webkitOverflowScrolling = 'touch';

    return () => {
      container.style.webkitOverflowScrolling = 'auto';
    };
  }, [isSafari]);

  const safariOverscan = isSafari ? Math.max(overscan, 10) : overscan;
  const scrollThreshold = isSafari ? 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`${styles.safariViewportList} ${className || ''}`}
    >
      <ViewportList
        items={items}
        overscan={safariOverscan}
        scrollThreshold={scrollThreshold}
        withCache={true}
        initialPrerender={safariOverscan}
      >
        {(item, index) => children(item, index)}
      </ViewportList>
    </div>
  );
};

export default SafariViewportList;