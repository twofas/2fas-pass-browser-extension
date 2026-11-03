// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// The save prompt is shown only after the login request has completed without an error status. The request body is
// matched in onBeforeRequest (the only event that carries it), so the decision and the response outcome arrive
// separately and in either order.

import { describe, it, expect, vi } from 'vitest';
import {
  trackSavePromptRequest,
  resolveSavePromptRequest,
  completeSavePromptRequest,
  isFailedResponseStatus,
  PENDING_SAVE_PROMPT_REQUEST_TTL_MS
} from './pendingSavePromptRequests';

describe('pendingSavePromptRequests', () => {
  it('shows the prompt when the decision comes first and the request then completes', async () => {
    const pending = new Map();
    const show = vi.fn();

    trackSavePromptRequest(pending, 'r1');
    await resolveSavePromptRequest(pending, 'r1', show);

    expect(show).not.toHaveBeenCalled();

    await completeSavePromptRequest(pending, 'r1', true);

    expect(show).toHaveBeenCalledTimes(1);
    expect(pending.size).toBe(0);
  });

  it('shows the prompt when the request completes before the decision', async () => {
    const pending = new Map();
    const show = vi.fn();

    trackSavePromptRequest(pending, 'r1');
    await completeSavePromptRequest(pending, 'r1', true);

    expect(show).not.toHaveBeenCalled();

    await resolveSavePromptRequest(pending, 'r1', show);

    expect(show).toHaveBeenCalledTimes(1);
    expect(pending.size).toBe(0);
  });

  it('does not show the prompt when the request did not succeed', async () => {
    const pending = new Map();
    const show = vi.fn();

    trackSavePromptRequest(pending, 'r1');
    await resolveSavePromptRequest(pending, 'r1', show);
    await completeSavePromptRequest(pending, 'r1', false);

    expect(show).not.toHaveBeenCalled();
    expect(pending.size).toBe(0);
  });

  it('does not show the prompt when the request failed before the decision', async () => {
    const pending = new Map();
    const show = vi.fn();

    trackSavePromptRequest(pending, 'r1');
    await completeSavePromptRequest(pending, 'r1', false);
    await resolveSavePromptRequest(pending, 'r1', show);

    expect(show).not.toHaveBeenCalled();
    expect(pending.size).toBe(0);
  });

  it('forgets a request that does not qualify for a prompt', async () => {
    const pending = new Map();

    trackSavePromptRequest(pending, 'r1');
    await resolveSavePromptRequest(pending, 'r1', null);

    expect(pending.size).toBe(0);

    await completeSavePromptRequest(pending, 'r1', true);

    expect(pending.size).toBe(0);
  });

  it('ignores the completion of a request it does not track', async () => {
    const pending = new Map();

    await completeSavePromptRequest(pending, 'other', true);

    expect(pending.size).toBe(0);
  });

  it('shows the prompt only once', async () => {
    const pending = new Map();
    const show = vi.fn();

    trackSavePromptRequest(pending, 'r1');
    await resolveSavePromptRequest(pending, 'r1', show);
    await completeSavePromptRequest(pending, 'r1', true);
    await completeSavePromptRequest(pending, 'r1', true);

    expect(show).toHaveBeenCalledTimes(1);
  });

  it('drops requests older than the time to live when a new one is tracked', () => {
    const pending = new Map();

    trackSavePromptRequest(pending, 'old', 1000);
    trackSavePromptRequest(pending, 'new', 1000 + PENDING_SAVE_PROMPT_REQUEST_TTL_MS + 1);

    expect(pending.has('old')).toBe(false);
    expect(pending.has('new')).toBe(true);
  });

  it('treats 4xx and 5xx as failed, and other or missing statuses as not failed', () => {
    expect(isFailedResponseStatus(400)).toBe(true);
    expect(isFailedResponseStatus(503)).toBe(true);
    expect(isFailedResponseStatus(200)).toBe(false);
    expect(isFailedResponseStatus(302)).toBe(false);
    expect(isFailedResponseStatus(undefined)).toBe(false);
  });
});
