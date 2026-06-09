// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { RESULT, summarize, exitCodeFor, formatTable } from './report.js';

const results = [
  { url: 'https://a', result: RESULT.PASS, detail: '' },
  { url: 'https://b', result: RESULT.SKIP, detail: 'no load' },
  { url: 'https://c', result: RESULT.FAIL, detail: 'not filled' }
];

describe('report', () => {
  it('summarizes counts', () => {
    expect(summarize(results)).toEqual({ pass: 1, skip: 1, fail: 1, total: 3 });
  });

  it('exit code is 1 when any FAIL', () => {
    expect(exitCodeFor(results, { setupFailure: false })).toBe(1);
  });

  it('exit code is 0 when only PASS/SKIP', () => {
    expect(exitCodeFor([{ url: 'x', result: RESULT.PASS }, { url: 'y', result: RESULT.SKIP }], {})).toBe(0);
  });

  it('exit code is 2 on setup failure regardless of results', () => {
    expect(exitCodeFor([], { setupFailure: true })).toBe(2);
  });

  it('formats a table containing every url and result', () => {
    const table = formatTable(results);
    expect(table).toContain('https://a');
    expect(table).toContain('PASS');
    expect(table).toContain('SKIP');
    expect(table).toContain('FAIL');
  });
});
