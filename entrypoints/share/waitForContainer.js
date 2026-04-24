// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const CONTAINER_ID = 'twofas-pass-extension-container';
const CONTAINER_TIMEOUT = 10000;

const waitForContainer = (timeout = CONTAINER_TIMEOUT) => new Promise(resolve => {
  const container = document.getElementById(CONTAINER_ID);

  if (container) {
    resolve(container);
    return;
  }

  const observer = new MutationObserver(() => {
    const el = document.getElementById(CONTAINER_ID);

    if (el) {
      observer.disconnect();
      clearTimeout(timer);
      resolve(el);
    }
  });

  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

  const timer = setTimeout(() => {
    observer.disconnect();
    resolve(null);
  }, timeout);
});

export default waitForContainer;
