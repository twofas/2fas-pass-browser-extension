// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getElementInitialScale from './getElementInitialScale';

const AUTOFILL_ANIMATION_DURATION = 200;
const AUTOFILL_ANIMATION_CLEANUP_DELAY = 50;
const AUTOFILL_SCALE_FACTOR = 1.05;
const ANIMATED_STYLE_PROPERTIES = [
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'transition-behavior',
  'transform-origin',
  'will-change',
  'scale'
];
const runningAnimations = new WeakMap();

/**
* Function to snapshot the inline style properties touched by the autofill animation.
* @param {HTMLElement} el - The element to snapshot.
* @return {Array<{property: string, value: string, priority: string}>} The saved inline styles.
*/
const saveInlineStyles = el => ANIMATED_STYLE_PROPERTIES.map(property => ({
  property,
  value: el.style.getPropertyValue(property),
  priority: el.style.getPropertyPriority(property)
}));

/**
* Function to restore previously saved inline style properties.
* @param {HTMLElement} el - The element to restore.
* @param {Array<{property: string, value: string, priority: string}>} savedStyles - The saved inline styles.
* @return {void}
*/
const restoreInlineStyles = (el, savedStyles) => {
  savedStyles.forEach(({ property, value, priority }) => {
    if (value) {
      el.style.setProperty(property, value, priority);
    } else {
      el.style.removeProperty(property);
    }
  });
};

/**
* Function to play the autofill scale animation on an input element using its own important inline transition, independent of the page styles.
* @param {HTMLElement} el - The element to animate.
* @return {void}
*/
const animateAutofilledInput = el => {
  const running = runningAnimations.get(el);

  if (running) {
    clearTimeout(running.timeoutId);
  }

  const savedStyles = running?.savedStyles ?? saveInlineStyles(el);
  const initialScale = running?.initialScale ?? getElementInitialScale(el);
  const animation = { savedStyles, initialScale, timeoutId: null };

  runningAnimations.set(el, animation);

  el.style.setProperty('transition', `scale ${AUTOFILL_ANIMATION_DURATION}ms ease-in-out`, 'important');
  el.style.setProperty('transform-origin', 'center center', 'important');
  el.style.setProperty('will-change', 'scale', 'important');
  el.style.setProperty('scale', `${initialScale * AUTOFILL_SCALE_FACTOR}`, 'important');

  animation.timeoutId = setTimeout(() => {
    restoreInlineStyles(el, savedStyles.filter(({ property }) => property === 'scale'));

    animation.timeoutId = setTimeout(() => {
      restoreInlineStyles(el, savedStyles);
      runningAnimations.delete(el);
    }, AUTOFILL_ANIMATION_DURATION + AUTOFILL_ANIMATION_CLEANUP_DELAY);
  }, AUTOFILL_ANIMATION_DURATION);
};

export default animateAutofilledInput;
