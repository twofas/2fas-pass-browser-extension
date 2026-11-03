// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const MESSAGES = {
  private_access_steps_safari: 'Safari step one.\nSafari step two.\nSafari step three.',
  private_access_steps_firefox: 'Firefox step one.\nFirefox step two.',
  private_access_steps_edge: 'Edge step one.\nEdge step two.',
  private_access_steps_chrome: 'Chrome step one.\nChrome step two.'
};
const stableI18n = { getMessage: key => MESSAGES[key] || key, lang: 'en' };

vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => stableI18n }));

import PrivateAccess from './index.jsx';

/**
* Renders the screen inside a router, as the popup does.
* @return {void}
*/
const renderScreen = () => {
  render(
    <MemoryRouter initialEntries={['/private-access']}>
      <PrivateAccess />
    </MemoryRouter>
  );
};

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('PrivateAccess — tells the user how to allow the extension in private windows', () => {
  it.each([
    ['safari', 'Safari step one.', 3],
    ['firefox', 'Firefox step one.', 2],
    ['edge', 'Edge step one.', 2],
    ['chrome', 'Chrome step one.', 2],
    ['opera', 'Chrome step one.', 2]
  ])('shows the %s steps as a numbered list', (browserName, firstStep, count) => {
    vi.stubEnv('BROWSER', browserName);

    renderScreen();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('private_access_title');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(count);
    expect(items[0].textContent).toBe(firstStep);
  });

  it('offers copying from the item list as the alternative, with a link to the list', () => {
    renderScreen();

    expect(screen.getByText('private_access_copy_info')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'private_access_go_to_list' }).getAttribute('href')).toBe('/');
  });
});
