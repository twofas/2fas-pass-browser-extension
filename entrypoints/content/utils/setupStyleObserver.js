// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Prevents external style modifications by monitoring and resetting element styles.
 * @param {HTMLElement} element - The DOM element to protect from style changes
 * @param {string} styles - The CSS styles to maintain on the element
 * @return {MutationObserver} The observer instance for manual disconnection if needed
 */
const setupStyleObserver = (element, styles) => {
  const observer = new MutationObserver(() => {
    CatchError(new TwoFasError(TwoFasError.internalErrors.setupStyleObserverMutationDetected,
      { additional: {
        url: window.location.href,
        hostname: window.location.hostname,
        pathname: window.location.pathname
      } }
    ));
    
    observer.disconnect();
    
    element.className = '';
    element.style = styles;
    
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  });

  observer.observe(element, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  return observer;
};

export default setupStyleObserver;