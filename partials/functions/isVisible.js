// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Tells whether an overflow value lets the user scroll hidden content into view.
* @param {string} overflow - A computed overflow-x / overflow-y value.
* @return {boolean} True for user-scrollable overflow ('auto' / 'scroll').
*/
const isUserScrollableOverflow = overflow => overflow === 'auto' || overflow === 'scroll';

/**
* Tells whether an overflow value clips its content (scrollable or not).
* @param {string} overflow - A computed overflow-x / overflow-y value.
* @return {boolean} True when content outside the box is clipped ('auto' / 'scroll' / 'hidden' / 'clip').
*/
const isClippingOverflow = overflow => isUserScrollableOverflow(overflow) || overflow === 'hidden' || overflow === 'clip';

/**
* Checks if a DOM element is visible.
* @param {HTMLElement} domElement - The DOM element to check.
* @return {boolean} True if the element is visible, false otherwise. True if domElement.checkVisibility is not a function.
*/
const isVisible = domElement => {
  if (!domElement) {
    return false;
  }

  let browserVisibilityAPIAvailable = false;
  let browserVisible = true;

  if (typeof domElement.checkVisibility === 'function') {
    browserVisibilityAPIAvailable = true;
    browserVisible = domElement.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    });

    if (!browserVisible) {
      return false;
    }
  }

  const rect = domElement.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  const style = window.getComputedStyle(domElement);

  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(100%)') {
    return false;
  }

  // Reachability: the user can only see an element (now or after scrolling) when its
  // box can be brought into the visible area of every clipping ancestor and of the
  // viewport. User-scrollable ancestors (overflow auto/scroll) and the viewport can
  // reveal anything inside their scroll range [origin, origin + scrollSize];
  // non-scrollable clips (overflow hidden/clip) only ever show their current client
  // box. A box lying entirely outside the reachable range is never visible (e.g.
  // left:-9999px, a slide parked outside an overflow:hidden carousel, or a row
  // scrolled out of a nested list with no scroll room left). Boxes merely scrolled out
  // of the current view stay within range and pass. checkVisibility() ignores scroll
  // position, so this always runs. As we cross each clipping ancestor the element's
  // effective box collapses to that ancestor's client box (where it appears once
  // scrolled in), so nested containers compose correctly.
  let effectiveLeft = rect.left;
  let effectiveRight = rect.right;
  let effectiveTop = rect.top;
  let effectiveBottom = rect.bottom;
  let scrollAncestor = domElement.parentElement;

  while (scrollAncestor && scrollAncestor !== document.body && scrollAncestor !== document.documentElement) {
    const scrollAncestorStyle = window.getComputedStyle(scrollAncestor);
    const overflowX = scrollAncestorStyle.overflowX;
    const overflowY = scrollAncestorStyle.overflowY;

    if (isClippingOverflow(overflowX) || isClippingOverflow(overflowY)) {
      const scrollAncestorRect = scrollAncestor.getBoundingClientRect();

      if (isClippingOverflow(overflowX)) {
        const clientLeft = scrollAncestorRect.left + scrollAncestor.clientLeft;
        let reachableLeft = clientLeft;
        let reachableRight = clientLeft + scrollAncestor.clientWidth;

        if (isUserScrollableOverflow(overflowX)) {
          reachableLeft = clientLeft - scrollAncestor.scrollLeft;
          reachableRight = reachableLeft + scrollAncestor.scrollWidth;
        }

        if (effectiveRight <= reachableLeft || effectiveLeft >= reachableRight) {
          return false;
        }

        effectiveLeft = clientLeft;
        effectiveRight = clientLeft + scrollAncestor.clientWidth;
      }

      if (isClippingOverflow(overflowY)) {
        const clientTop = scrollAncestorRect.top + scrollAncestor.clientTop;
        let reachableTop = clientTop;
        let reachableBottom = clientTop + scrollAncestor.clientHeight;

        if (isUserScrollableOverflow(overflowY)) {
          reachableTop = clientTop - scrollAncestor.scrollTop;
          reachableBottom = reachableTop + scrollAncestor.scrollHeight;
        }

        if (effectiveBottom <= reachableTop || effectiveTop >= reachableBottom) {
          return false;
        }

        effectiveTop = clientTop;
        effectiveBottom = clientTop + scrollAncestor.clientHeight;
      }
    }

    scrollAncestor = scrollAncestor.parentElement;
  }

  const viewportReachableLeft = -window.scrollX;
  const viewportReachableTop = -window.scrollY;

  if (effectiveRight <= viewportReachableLeft || effectiveLeft >= viewportReachableLeft + document.documentElement.scrollWidth) {
    return false;
  }

  if (effectiveBottom <= viewportReachableTop || effectiveTop >= viewportReachableTop + document.documentElement.scrollHeight) {
    return false;
  }

  // When the native visibility API is available, checkVisibility() above already
  // accounts for ancestor display:none, visibility:hidden and opacity:0 (inherited,
  // or caught by visibilityProperty/opacityProperty walking inclusive ancestors), so
  // the manual ancestor walk below would only repeat that work with O(depth)
  // getComputedStyle calls per candidate. Keep it solely as a fallback for browsers
  // without checkVisibility().
  if (!browserVisibilityAPIAvailable) {
    let parent = domElement.parentElement;

    while (parent && parent !== document.body && parent !== document.documentElement) {
      const parentStyle = window.getComputedStyle(parent);

      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        return false;
      }

      if (parentStyle.display !== 'contents') {
        const parentRect = parent.getBoundingClientRect();
        const parentOverflow = parentStyle.overflow;

        if (parentRect.height === 0 || parentRect.width === 0) {
          if (parentOverflow !== 'visible') {
            return false;
          }
        }
      }

      if (parseFloat(parentStyle.opacity) === 0) {
        return false;
      }

      parent = parent.parentElement;
    }
  }

  return true;
};

export default isVisible;
