// @vitest-environment node
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { ROOT, getAutoImports, findImportLeaks } from '@/tests/importGraph/findImportLeaks';

describe('background service worker stays free of React', () => {
  it('entrypoints/background/index.js does not reach React, .jsx or CSS modules', () => {
    const entry = path.join(ROOT, 'entrypoints/background/index.js');

    expect(findImportLeaks(entry, getAutoImports(), { allowPopupModules: true })).toEqual([]);
  });
});
