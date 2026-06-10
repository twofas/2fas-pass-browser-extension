// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const STYLE_OBSERVER_REPORT_INTERVAL = 60000;

/**
 * Decides whether a detected style mutation should be reported, rate-limiting reports to avoid CatchError storms on pages that cyclically mutate the host's style/class.
 * @param {Object} params - The decision inputs.
 * @param {number} params.lastReportTime - Timestamp (ms) of the last report, or 0 if never reported.
 * @param {number} params.now - Current timestamp (ms).
 * @param {number} [params.interval] - Minimum interval (ms) between reports.
 * @return {boolean} True if the mutation should be reported.
 */
export const shouldReportStyleMutation = ({ lastReportTime, now, interval = STYLE_OBSERVER_REPORT_INTERVAL }) => {
  if (lastReportTime === 0) {
    return true;
  }

  return now - lastReportTime >= interval;
};

/**
 * Prevents external style modifications by monitoring and resetting element styles.
 * @param {HTMLElement} element - The DOM element to protect from style changes
 * @param {string} styles - The CSS styles to maintain on the element
 * @return {Object} Object containing observer instance and control functions
 */
const setupStyleObserver = (element, styles) => {
  let isDisconnected = false;
  let isPaused = false;
  let lastReportTime = 0;
  let suppressedMutations = 0;

  const restoreStyles = () => {
    observer.disconnect();

    element.className = '';
    element.style = styles;

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  };

  const reportMutation = () => {
    const now = Date.now();

    if (!shouldReportStyleMutation({ lastReportTime, now })) {
      suppressedMutations += 1;
      return;
    }

    CatchError(new TwoFasError(TwoFasError.internalErrors.setupStyleObserverMutationDetected,
      { additional: {
        url: window.location.href,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        suppressedMutations
      } }
    ));

    lastReportTime = now;
    suppressedMutations = 0;
  };

  const observer = new MutationObserver(() => {
    if (isPaused) {
      return;
    }

    reportMutation();
    restoreStyles();
  });

  observer.observe(element, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  const disconnect = () => {
    if (!isDisconnected) {
      isPaused = true;
      observer.disconnect();
      isDisconnected = true;
    }
  };

  const reconnect = () => {
    if (isDisconnected) {
      element.className = '';
      element.style = styles;

      observer.observe(element, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });

      isDisconnected = false;
      isPaused = false;
    }
  };

  return {
    observer,
    disconnect,
    reconnect
  };
};

export default setupStyleObserver;