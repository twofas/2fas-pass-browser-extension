// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useCallback, useLayoutEffect, memo, useState } from 'react';
import styles from './SafariViewportList.module.scss';

const ITEM_HEIGHT = 66;

const findScrollableParent = element => {
  if (!element) {
    return null;
  }

  let parent = element.parentElement;

  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);

    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
};

const SafariViewportList = ({ items, children, overscan = 10, className }) => {
  const listRef = useRef(null);
  const [scrollElement, setScrollElement] = useState(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const getScrollElement = useCallback(() => scrollElement, [scrollElement]);
  const estimateSize = useCallback(() => ITEM_HEIGHT, []);
  const getItemKey = useCallback(index => items[index]?.id ?? index, [items]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement,
    estimateSize,
    getItemKey,
    overscan,
    scrollMargin
  });

  useLayoutEffect(() => {
    if (!listRef.current || scrollElement) {
      return;
    }

    const parent = findScrollableParent(listRef.current);

    if (parent) {
      setScrollElement(parent);
    }
  }, [scrollElement]);

  useLayoutEffect(() => {
    if (!listRef.current || !scrollElement) {
      return;
    }

    const parentRect = scrollElement.getBoundingClientRect();
    const listRect = listRef.current.getBoundingClientRect();
    const newMargin = Math.round(listRect.top - parentRect.top + scrollElement.scrollTop);
    setScrollMargin(prev => prev === newMargin ? prev : newMargin);
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={listRef}
      className={`${styles.safariViewportList}${className ? ` ${className}` : ''}`}
      style={{
        height: `${totalSize}px`,
        position: 'relative',
        width: '100%'
      }}
    >
      <div
        style={{
          left: 0,
          position: 'absolute',
          top: 0,
          transform: `translate3d(0,${(virtualItems[0]?.start ?? 0) - scrollMargin}px,0)`,
          width: '100%',
          willChange: 'transform'
        }}
      >
        {virtualItems.map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{ height: `${ITEM_HEIGHT}px` }}
          >
            {children(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(SafariViewportList);
