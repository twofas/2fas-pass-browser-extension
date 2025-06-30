// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup (wxt) {
    wxt.hook('config:resolved', () => {
      if (wxt.config.browser === 'safari') {
        const baseDir = './.output/';
        wxt.config.outDir = baseDir + 'safari-mv3';
      }
    });
  }
});
