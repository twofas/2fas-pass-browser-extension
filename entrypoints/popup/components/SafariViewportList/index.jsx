// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useMemo, useCallback, useLayoutEffect, memo, useState } from 'react';
import styles from './SafariViewportList.module.scss';

const ITEM_HEIGHT = 66;

/**
 * Finds the closest scrollable parent element
 * @param {HTMLElement} element - Starting element
 * @returns {HTMLElement|null} Scrollable parent or null
 */
const findScrollableParent = element => {
  if (!element) {
    return null;
  }

  let parent = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll';

    if (isScrollable) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
};

/**
 * High-performance virtualized list component optimized for Safari and all browsers
 * @param {Array} items - Array of items to render
 * @param {Function} children - Render function for each item receiving (item, index)
 * @param {number} overscan - Number of items to render outside viewport
 * @param {string} className - Optional className for the wrapper
 * @returns {JSX.Element} Virtualized list component
 */
const SafariViewportList = ({ items, children, overscan = 10, className }) => {
  const listRef = useRef(null);
  const [scrollElement, setScrollElement] = useState(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const isSafari = useMemo(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('safari') && !userAgent.includes('chrome');
  }, []);

  const safariOverscan = isSafari ? Math.max(overscan, 10) : overscan;

  const getScrollElement = useCallback(() => scrollElement, [scrollElement]);

  const estimateSize = useCallback(() => ITEM_HEIGHT, []);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement,
    estimateSize,
    overscan: safariOverscan,
    scrollMargin
  });

  useLayoutEffect(() => {
    if (listRef.current) {
      const scrollParent = findScrollableParent(listRef.current);

      if (scrollParent && listRef.current) {
        const parentRect = scrollParent.getBoundingClientRect();
        const listRect = listRef.current.getBoundingClientRect();
        const margin = listRect.top - parentRect.top + scrollParent.scrollTop;

        setScrollElement(scrollParent);
        setScrollMargin(margin);
      }
    }
  }, []);

  useEffect(() => {
    if (scrollElement) {
      virtualizer.measure();
    }
  }, [items.length, scrollElement]);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={listRef}
      className={`${styles.safariViewportList} ${className || ''}`}
      style={{
        height: `${totalSize}px`,
        position: 'relative',
        width: '100%'
      }}
    >
      {virtualItems.map(virtualItem => {
        const item = items[virtualItem.index];

        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              left: 0,
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualItem.start - scrollMargin}px)`,
              width: '100%'
            }}
          >
            {children(item, virtualItem.index)}
          </div>
        );
      })}
    </div>
  );
};

export default memo(SafariViewportList);
