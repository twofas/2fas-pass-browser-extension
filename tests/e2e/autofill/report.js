// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const RESULT = Object.freeze({ PASS: 'PASS', SKIP: 'SKIP', FAIL: 'FAIL' });

const ANSI = Object.freeze({ green: '\x1b[32m', red: '\x1b[31m', reset: '\x1b[0m' });

/**
* Wraps text in an ANSI color based on the result: PASS → green, FAIL → red.
* Other results (and disabled color) are returned unchanged.
* @param {string} text - The text to color.
* @param {string} result - The RESULT value driving the color.
* @param {boolean} [enabled] - Whether to emit color codes (default true).
* @return {string} The optionally colored text.
*/
export const colorize = (text, result, enabled = true) => {
  if (!enabled) {
    return text;
  }

  if (result === RESULT.PASS) {
    return `${ANSI.green}${text}${ANSI.reset}`;
  }

  if (result === RESULT.FAIL) {
    return `${ANSI.red}${text}${ANSI.reset}`;
  }

  return text;
};

/**
* Counts results by type.
* @param {Array<{result:string}>} results - The per-URL results.
* @return {{pass:number,skip:number,fail:number,total:number}} The counts.
*/
export const summarize = results => {
  const list = Array.isArray(results) ? results : [];

  return {
    pass: list.filter(r => r.result === RESULT.PASS).length,
    skip: list.filter(r => r.result === RESULT.SKIP).length,
    fail: list.filter(r => r.result === RESULT.FAIL).length,
    total: list.length
  };
};

/**
* Computes the process exit code for a run.
* @param {Array<{result:string}>} results - The per-URL results.
* @param {{setupFailure?:boolean}} [opts] - Run options.
* @return {number} 2 = setup failure, 1 = at least one FAIL, 0 = ok.
*/
export const exitCodeFor = (results, opts = {}) => {
  if (opts.setupFailure) {
    return 2;
  }

  return summarize(results).fail > 0 ? 1 : 0;
};

/**
* Formats a human-readable summary table. Colors PASS green and FAIL red when
* `opts.color` is true (default off so the output stays plain/testable).
* @param {Array<{url:string,result:string,detail?:string}>} results - The per-URL results.
* @param {{color?:boolean}} [opts] - Formatting options.
* @return {string} The formatted table.
*/
export const formatTable = (results, opts = {}) => {
  const list = Array.isArray(results) ? results : [];
  const color = opts.color === true;
  const rows = list.map(r => `  ${colorize(r.result.padEnd(4), r.result, color)}  ${r.url}${r.detail ? `  — ${r.detail}` : ''}`);
  const s = summarize(list);
  const passCount = colorize(`${s.pass} PASS`, RESULT.PASS, color);
  const failCount = colorize(`${s.fail} FAIL`, RESULT.FAIL, color);

  return [
    'Autofill E2E results:',
    ...rows,
    `Totals: ${passCount}, ${s.skip} SKIP, ${failCount} (${s.total} total)`
  ].join('\n');
};
