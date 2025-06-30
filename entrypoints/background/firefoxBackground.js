// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to handle Firefox-specific background tasks.
* @return {void}
*/
const firefoxBackground = () => {
  if (browser?.runtime?.onPerformanceWarning && typeof browser?.runtime?.onPerformanceWarning?.addListener === 'function') {
    browser.runtime.onPerformanceWarning.addListener(async warning => {
      try {
        await CatchError({
          name: 'PerformanceWarning',
          message: warning?.description || '',
          additional: {
            category: warning?.category || '',
            severity: warning?.severity || '',
            tabId: warning?.tabId || ''
          }
        });
      } catch {}
    });
  }
};

export default firefoxBackground;
