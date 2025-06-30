// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup (wxt) {
    wxt.hook('build:publicAssets', (wxt, files) => {
      if (wxt.config.browser === 'safari') {
        const toRemove = files.filter(file => {
          const rel = file.relativeDest.replace(/\\/g, '/');
          return rel.startsWith('animations/') && rel.endsWith('.json');
        });

        for (const file of toRemove) {
          const idx = files.indexOf(file);
          if (idx !== -1) {
            files.splice(idx, 1);
          }
        }
      } else {
        const toRemove = files.filter(file => {
          const rel = file.relativeDest.replace(/\\/g, '/');
          return rel.startsWith('animations/') && rel.endsWith('.svg');
        });

        for (const file of toRemove) {
          const idx = files.indexOf(file);
          if (idx !== -1) {
            files.splice(idx, 1);
          }
        }
      }
    });
  }
});
