// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Regression coverage for finding #9: the multi-step-login fix relies on the
// flush path harvesting a username input's value EVEN WHEN it carries
// twofas-pass-skip='true' (the skip flag only suppresses noisy live per-keystroke
// capture on password-less forms; the value is intentionally harvested at a
// commit event — submit / Enter / unload, and now a button click). If a future
// change made flushPendingInputs honour the skip attribute, the save prompt for
// SPA multi-step logins would silently break again. These tests pin the contract.

import { describe, it, expect, beforeEach } from 'vitest';
import flushPendingInputs from './flushPendingInputs';

const addInput = ({ id, value, type = 'text', skip } = {}) => {
  const input = document.createElement('input');
  input.type = type;

  if (typeof value === 'string') {
    input.value = value;
  }

  if (id) {
    input.setAttribute('twofas-pass-id', id);
  }

  if (skip) {
    input.setAttribute('twofas-pass-skip', skip);
  }

  document.body.appendChild(input);

  return input;
};

describe('flushPendingInputs — harvests skip-tagged usernames (finding #9)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('includes a username input that carries twofas-pass-skip="true"', () => {
    const input = addInput({ id: 'u1', value: 'alice@example.com', skip: 'true' });

    const data = flushPendingInputs([input], {}, {});

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ id: 'u1', type: 'username', value: 'alice@example.com' });
  });

  it('clears any pending debounce timers it is handed', () => {
    const input = addInput({ id: 'u1', value: 'alice', skip: 'true' });
    const timers = { 'some-key': setTimeout(() => {}, 10000) };

    flushPendingInputs([input], timers, {});

    expect(Object.keys(timers)).toHaveLength(0);
  });

  it('skips untagged inputs and empty values, regardless of skip flag', () => {
    const untagged = addInput({ value: 'no-id', skip: 'true' });
    const empty = addInput({ id: 'u2', value: '', skip: 'true' });
    const filled = addInput({ id: 'u3', value: 'bob', skip: 'true' });

    const data = flushPendingInputs([untagged, empty, filled], {}, {});

    expect(data.map(d => d.id)).toEqual(['u3']);
  });

  it('falls back to latestValues for ids not present in the DOM pass', () => {
    const filled = addInput({ id: 'u3', value: 'bob', skip: 'true' });
    const latestValues = { 'p1': { id: 'p1', type: 'password', value: 'secret', sent: false } };

    const data = flushPendingInputs([filled], {}, latestValues);

    expect(data.map(d => d.id).sort()).toEqual(['p1', 'u3']);
  });
});
