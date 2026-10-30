// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach } from 'vitest';
import isSavePromptRequestActive, { noteSavePromptRequestStart, getSavePromptRequestState } from './isSavePromptRequestActive';
import { wsState, resetState } from '../../websocket/wsState';

describe('isSavePromptRequestActive', () => {
  beforeEach(() => {
    resetState();
  });

  it('is true while a request started from the save prompt runs', () => {
    wsState.active = true;
    wsState.type = 'fetch';
    wsState.fetchLocationState = { action: 'addData', from: 'savePrompt' };

    expect(isSavePromptRequestActive()).toBe(true);
  });

  it('is false for a request started elsewhere', () => {
    wsState.active = true;
    wsState.type = 'fetch';
    wsState.fetchLocationState = { action: 'addData', from: 'add-new' };

    expect(isSavePromptRequestActive()).toBe(false);
  });

  it('is false once the request was cancelled or ended', () => {
    expect(isSavePromptRequestActive()).toBe(false);
  });

  it('remembers when the last save prompt request started, also after it ended', () => {
    noteSavePromptRequestStart(1234);
    resetState();

    expect(getSavePromptRequestState()).toEqual({ active: false, startedAt: 1234 });
  });
});

