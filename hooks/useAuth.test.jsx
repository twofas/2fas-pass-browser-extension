// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.mock('@/partials/sessionStorage/configured/getConfiguredBoolean', () => ({ default: vi.fn(async () => false) }));
vi.mock('@/partials/sessionStorage/configured/setConfigured', () => ({ default: vi.fn(async () => true) }));
vi.mock('@/partials/functions/cleanupDevices', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@/entrypoints/background/utils/regenerateLocalKey', () => ({ default: vi.fn(async () => {}) }));

import setConfigured from '@/partials/sessionStorage/configured/setConfigured';
import { AuthProvider, useAuthActions, useAuthState } from './useAuth.jsx';

let actions = null;

/**
* Exposes the auth actions and renders the configured state.
* @return {JSX.Element} The probe.
*/
const Probe = () => {
  actions = useAuthActions();
  const { configured } = useAuthState();

  return <span>{configured ? 'configured' : 'locked'}</span>;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  actions = null;
});

describe('AuthProvider login — the background has already stored the configured state', () => {
  it('does not write the configured state a second time', async () => {
    render(
      <MemoryRouter initialEntries={['/connect']}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('locked');

    await act(async () => {
      await actions.login();
    });

    expect(setConfigured).not.toHaveBeenCalled();
    expect(screen.getByText('configured')).toBeTruthy();
  });
});
