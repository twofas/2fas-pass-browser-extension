// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './CopyTooltip.module.scss';
import { useCallback, useRef, useState } from 'react';

const TOOLTIP_SPACE = 64;

/**
* Function to get the visible vertical boundary of the nearest scrollable ancestor.
* @param {HTMLElement} element - The element to start the search from.
* @return {Object} The boundary with top and bottom coordinates in viewport space.
*/
const getScrollBoundary = element => {
  let node = element?.parentElement;

  while (node) {
    const { overflowY } = getComputedStyle(node);

    if (overflowY === 'auto' || overflowY === 'scroll') {
      const rect = node.getBoundingClientRect();
      return { top: Math.max(rect.top, 0), bottom: Math.min(rect.bottom, window.innerHeight) };
    }

    node = node.parentElement;
  }

  return { top: 0, bottom: window.innerHeight };
};

/**
* Function component wrapping a copy button with a hover tooltip shown when the button is disabled.
* Flips the tooltip to the opposite side when the preferred side has no visible space.
* @param {Object} props - The component props.
* @param {string} props.text - The tooltip text explaining why the button is disabled.
* @param {boolean} props.active - Whether the tooltip is active (button disabled due to empty value).
* @param {string} [props.position] - Preferred tooltip position: 'top' (default) or 'bottom'.
* @param {string} [props.className] - Additional class name for the wrapper.
* @param {JSX.Element} props.children - The wrapped button element.
* @return {JSX.Element} The rendered component.
*/
function CopyTooltip (props) {
  const { text, active, position, className, children } = props;
  const wrapperRef = useRef(null);
  const [flipped, setFlipped] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!wrapperRef.current) {
      return;
    }

    const rect = wrapperRef.current.getBoundingClientRect();
    const boundary = getScrollBoundary(wrapperRef.current);
    const spaceAbove = rect.top - boundary.top;
    const spaceBelow = boundary.bottom - rect.bottom;

    if (position === 'bottom') {
      setFlipped(spaceBelow < TOOLTIP_SPACE && spaceAbove > spaceBelow);
    } else {
      setFlipped(spaceAbove < TOOLTIP_SPACE && spaceBelow > spaceAbove);
    }
  }, [position]);

  const showBottom = position === 'bottom' ? !flipped : flipped;

  return (
    <span
      ref={wrapperRef}
      className={`${S.copyTooltip} ${showBottom ? S.bottom : ''} ${className || ''}`}
      data-tooltip={active ? text : undefined}
      onMouseEnter={active ? handleMouseEnter : undefined}
    >
      {children}
    </span>
  );
}

export default CopyTooltip;
