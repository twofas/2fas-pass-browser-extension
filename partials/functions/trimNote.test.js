// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Notes (notes, s_text, additionalInfo) are multi-line texts: an empty line at the
// start or the end is part of the note and is kept. Only the spaces and tabs at the
// very start and end are removed.

import { describe, it, expect } from 'vitest';
import trimNote from './trimNote';

describe('trimNote', () => {
  it('keeps the empty lines at the start and the end of a note', () => {
    expect(trimNote('\n\nnote\n\n')).toBe('\n\nnote\n\n');
    expect(trimNote('\r\nnote\r\n')).toBe('\r\nnote\r\n');
  });

  it('removes the spaces and tabs at the start and the end of a note', () => {
    expect(trimNote('  note \t')).toBe('note');
    expect(trimNote(' line 1\n\nline 2 ')).toBe('line 1\n\nline 2');
  });

  it('keeps a line of whitespace only at the start or the end as an empty line', () => {
    expect(trimNote(' \t\nnote\n  ')).toBe('\nnote\n');
  });

  it('keeps the whitespace inside a note', () => {
    expect(trimNote('note\n  indented\n')).toBe('note\n  indented\n');
  });

  it('returns values that are not strings as they are', () => {
    expect(trimNote(undefined)).toBeUndefined();
    expect(trimNote(null)).toBeNull();
    expect(trimNote(5)).toBe(5);
  });
});
