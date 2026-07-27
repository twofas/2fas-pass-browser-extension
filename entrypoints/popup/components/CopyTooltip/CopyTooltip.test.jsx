// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Issue #46: copy buttons for empty values are disabled and explain why via a custom
// CSS tooltip (native title is unreliable on disabled elements in Safari). The wrapper
// span is ALWAYS rendered so the DOM stays stable; only the data-tooltip attribute
// (and therefore the ::after tooltip card) toggles with the `active` prop.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { createElement } from 'react';

import CopyTooltip from './index.jsx';
import S from './CopyTooltip.module.scss';

const renderTooltip = props => render(
  createElement(CopyTooltip, props, createElement('button', { type: 'button' }, 'copy'))
);

const mockWrapperRect = (wrapper, top, bottom) => {
  wrapper.getBoundingClientRect = () => ({
    top,
    bottom,
    left: 0,
    right: 32,
    width: 32,
    height: bottom - top,
    x: 0,
    y: top
  });
};

describe('CopyTooltip', () => {
  it('always renders the wrapper span with its children', () => {
    const { container } = renderTooltip({ text: 'no username', active: false });
    const wrapper = container.firstChild;

    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper.classList.contains(S.copyTooltip)).toBe(true);
    expect(wrapper.querySelector('button')).not.toBeNull();
  });

  it('sets data-tooltip only when active', () => {
    const { container, rerender } = renderTooltip({ text: 'no username', active: false });
    const wrapper = container.firstChild;

    expect(wrapper.hasAttribute('data-tooltip')).toBe(false);

    rerender(createElement(CopyTooltip, { text: 'no username', active: true }, createElement('button', { type: 'button' }, 'copy')));

    expect(wrapper.getAttribute('data-tooltip')).toBe('no username');
  });

  it('adds the bottom class only when position="bottom"', () => {
    const { container } = renderTooltip({ text: 'no username', active: true, position: 'bottom' });

    expect(container.firstChild.classList.contains(S.bottom)).toBe(true);

    const { container: defaultContainer } = renderTooltip({ text: 'no username', active: true });

    expect(defaultContainer.firstChild.classList.contains(S.bottom)).toBe(false);
  });

  describe('flip when the preferred side has no visible space', () => {
    afterEach(() => {
      cleanup();
      vi.unstubAllGlobals();
    });

    it('flips a top tooltip below the button when the button touches the top of the viewport', () => {
      vi.stubGlobal('innerHeight', 600);

      const { container } = renderTooltip({ text: 'no username', active: true });
      const wrapper = container.firstChild;

      mockWrapperRect(wrapper, 8, 40);
      fireEvent.mouseEnter(wrapper);

      expect(wrapper.classList.contains(S.bottom)).toBe(true);
    });

    it('flips a bottom tooltip above the button when the button touches the bottom of the viewport', () => {
      vi.stubGlobal('innerHeight', 600);

      const { container } = renderTooltip({ text: 'no username', active: true, position: 'bottom' });
      const wrapper = container.firstChild;

      mockWrapperRect(wrapper, 560, 592);
      fireEvent.mouseEnter(wrapper);

      expect(wrapper.classList.contains(S.bottom)).toBe(false);
    });

    it('keeps the preferred side when there is enough space', () => {
      vi.stubGlobal('innerHeight', 600);

      const { container } = renderTooltip({ text: 'no username', active: true });
      const wrapper = container.firstChild;

      mockWrapperRect(wrapper, 300, 332);
      fireEvent.mouseEnter(wrapper);

      expect(wrapper.classList.contains(S.bottom)).toBe(false);
    });

    it('respects the nearest scrollable ancestor as the boundary', () => {
      vi.stubGlobal('innerHeight', 600);

      const { container } = render(
        createElement(
          'div',
          { style: { overflowY: 'auto' } },
          createElement(CopyTooltip, { text: 'no username', active: true }, createElement('button', { type: 'button' }, 'copy'))
        )
      );

      const scrollParent = container.firstChild;
      const wrapper = scrollParent.firstChild;

      scrollParent.getBoundingClientRect = () => ({
        top: 56,
        bottom: 544,
        left: 0,
        right: 320,
        width: 320,
        height: 488,
        x: 0,
        y: 56
      });

      mockWrapperRect(wrapper, 60, 92);
      fireEvent.mouseEnter(wrapper);

      expect(wrapper.classList.contains(S.bottom)).toBe(true);
    });

    it('does not measure when inactive', () => {
      const { container } = renderTooltip({ text: 'no username', active: false });
      const wrapper = container.firstChild;

      mockWrapperRect(wrapper, 8, 40);
      fireEvent.mouseEnter(wrapper);

      expect(wrapper.classList.contains(S.bottom)).toBe(false);
    });
  });
});
