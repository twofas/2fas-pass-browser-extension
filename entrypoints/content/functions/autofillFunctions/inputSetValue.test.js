// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import inputSetValue from './inputSetValue.js';

vi.mock('@/partials/functions/isVisible', () => ({ default: () => true }));

const ANIMATION_DURATION = 200;

const mountInput = (style = '') => {
  document.body.innerHTML = `<input type="password" style="${style}" />`;
  return document.querySelector('input');
};

describe('inputSetValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('sets the value and dispatches input and change events', () => {
    const input = mountInput();
    const onInput = vi.fn();
    const onChange = vi.fn();

    input.addEventListener('input', onInput);
    input.addEventListener('change', onChange);

    inputSetValue(input, 'secret');

    expect(input.value).toBe('secret');
    expect(onInput).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('carries its own important inline scale transition so page styles cannot turn the animation into a jump', () => {
    const input = mountInput();

    inputSetValue(input, 'secret');

    expect(input.style.getPropertyValue('transition')).toContain('scale');
    expect(input.style.getPropertyPriority('transition')).toBe('important');
    expect(input.style.getPropertyValue('scale')).toBe('1.05');
    expect(input.style.getPropertyPriority('scale')).toBe('important');
  });

  it('keeps the transition while scaling back so the return is animated too', () => {
    const input = mountInput();

    inputSetValue(input, 'secret');
    vi.advanceTimersByTime(ANIMATION_DURATION);

    expect(input.style.getPropertyValue('scale')).toBe('');
    expect(input.style.getPropertyValue('transition')).toContain('scale');
  });

  it('restores the page inline styles once the animation is over', () => {
    const input = mountInput('transition: opacity 1s; scale: 0.9; will-change: opacity;');

    inputSetValue(input, 'secret');
    vi.runAllTimers();

    expect(input.style.getPropertyValue('transition')).toBe('opacity 1s');
    expect(input.style.getPropertyPriority('transition')).toBe('');
    expect(input.style.getPropertyValue('scale')).toBe('0.9');
    expect(input.style.getPropertyValue('will-change')).toBe('opacity');
    expect(input.style.getPropertyValue('transform-origin')).toBe('');
  });

  it('restores the page inline styles when the same input is filled again mid-animation', () => {
    const input = mountInput('transition: opacity 1s;');

    inputSetValue(input, 'first');
    vi.advanceTimersByTime(ANIMATION_DURATION / 2);
    inputSetValue(input, 'second');
    vi.runAllTimers();

    expect(input.value).toBe('second');
    expect(input.style.getPropertyValue('transition')).toBe('opacity 1s');
    expect(input.style.getPropertyValue('scale')).toBe('');
    expect(input.style.getPropertyValue('transform-origin')).toBe('');
    expect(input.style.getPropertyValue('will-change')).toBe('');
  });
});
