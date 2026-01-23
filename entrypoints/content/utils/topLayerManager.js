// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Manages the shadow host position relative to top layer elements (modal dialogs, popovers).
 * When a website opens a modal dialog, the dialog is placed in the browser's "top layer" which
 * renders above all other content including elements with max z-index. This manager detects
 * when top layer elements are opened and moves the shadow host inside them to ensure our
 * overlays remain visible.
 * @param {HTMLElement} shadowHost - The shadow host element to manage
 * @param {Function} disconnectStyleObserver - Function to disconnect the style observer
 * @param {Function} reconnectStyleObserver - Function to reconnect the style observer
 * @return {Object} Object containing cleanup function
 */
const topLayerManager = (shadowHost, disconnectStyleObserver, reconnectStyleObserver) => {
  let currentTopLayerElement = null;
  let originalParent = null;
  let dialogObserver = null;
  let bodyObserver = null;
  const trackedDialogs = new WeakSet();
  const dialogCloseHandlers = new WeakMap();

  const moveShadowHostToTopLayer = topLayerElement => {
    if (currentTopLayerElement === topLayerElement) {
      return;
    }

    if (!shadowHost || !topLayerElement) {
      return;
    }

    if (!originalParent) {
      originalParent = shadowHost.parentElement;
    }

    disconnectStyleObserver();

    try {
      topLayerElement.appendChild(shadowHost);
      currentTopLayerElement = topLayerElement;
    } catch (e) {
      CatchError(e);

      if (originalParent && !shadowHost.parentElement) {
        originalParent.appendChild(shadowHost);
      }
    }

    reconnectStyleObserver();
  };

  const moveShadowHostToBody = () => {
    if (!shadowHost) {
      return;
    }

    const targetParent = originalParent || document.body;

    disconnectStyleObserver();

    try {
      if (shadowHost.parentElement !== targetParent) {
        targetParent.appendChild(shadowHost);
      }
    } catch (e) {
      CatchError(e);

      if (!shadowHost.parentElement) {
        document.body.appendChild(shadowHost);
      }
    }

    currentTopLayerElement = null;
    reconnectStyleObserver();
  };

  const ensureShadowHostInDocument = () => {
    if (!shadowHost) {
      return;
    }

    if (!document.contains(shadowHost)) {
      const targetParent = originalParent || document.body;

      disconnectStyleObserver();

      try {
        targetParent.appendChild(shadowHost);
      } catch (e) {
        CatchError(e);
        document.body.appendChild(shadowHost);
      }

      currentTopLayerElement = null;
      reconnectStyleObserver();
    }
  };

  const findActiveTopLayerElement = () => {
    try {
      const modalDialogs = document.querySelectorAll('dialog:modal');

      if (modalDialogs.length > 0) {
        return modalDialogs[modalDialogs.length - 1];
      }

      const popovers = document.querySelectorAll('[popover]:popover-open');

      if (popovers.length > 0) {
        return popovers[popovers.length - 1];
      }
    } catch {
      return null;
    }

    return null;
  };

  const handleTopLayerChange = () => {
    ensureShadowHostInDocument();

    const activeTopLayer = findActiveTopLayerElement();

    if (activeTopLayer) {
      moveShadowHostToTopLayer(activeTopLayer);
    } else if (currentTopLayerElement) {
      moveShadowHostToBody();
    }
  };

  const handleDialogClose = () => {
    setTimeout(() => {
      handleTopLayerChange();
    }, 0);
  };

  const trackDialog = dialog => {
    if (trackedDialogs.has(dialog)) {
      return;
    }

    trackedDialogs.add(dialog);

    const closeHandler = () => handleDialogClose();
    dialogCloseHandlers.set(dialog, closeHandler);
    dialog.addEventListener('close', closeHandler);
  };

  const handleToggleEvent = event => {
    const target = event.target;

    if (target && target.hasAttribute && target.hasAttribute('popover')) {
      setTimeout(() => {
        handleTopLayerChange();
      }, 0);
    }
  };

  const setupDialogObserver = dialog => {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
          trackDialog(dialog);

          setTimeout(() => {
            try {
              if (dialog.matches(':modal')) {
                handleTopLayerChange();
              }
            } catch {
              handleTopLayerChange();
            }
          }, 0);
        }
      }
    });

    observer.observe(dialog, {
      attributes: true,
      attributeFilter: ['open']
    });

    return observer;
  };

  const setupBodyObserver = () => {
    const observers = [];

    const processExistingDialogs = () => {
      const dialogs = document.querySelectorAll('dialog');
      dialogs.forEach(dialog => {
        trackDialog(dialog);
        observers.push(setupDialogObserver(dialog));
      });
    };

    const checkRemovedNode = node => {
      if (!currentTopLayerElement) {
        return false;
      }

      if (node === currentTopLayerElement) {
        return true;
      }

      if (node.contains && node.contains(currentTopLayerElement)) {
        return true;
      }

      return false;
    };

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (checkRemovedNode(node)) {
                ensureShadowHostInDocument();
              }
            }
          });

          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'DIALOG') {
                trackDialog(node);
                observers.push(setupDialogObserver(node));
              }

              const nestedDialogs = node.querySelectorAll ? node.querySelectorAll('dialog') : [];
              nestedDialogs.forEach(dialog => {
                trackDialog(dialog);
                observers.push(setupDialogObserver(dialog));
              });
            }
          });
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    processExistingDialogs();

    return {
      disconnect: () => {
        observer.disconnect();
        observers.forEach(obs => obs.disconnect());
      }
    };
  };

  document.addEventListener('toggle', handleToggleEvent, true);

  bodyObserver = setupBodyObserver();

  setTimeout(() => {
    handleTopLayerChange();
  }, 100);

  const cleanup = () => {
    document.removeEventListener('toggle', handleToggleEvent, true);

    if (bodyObserver) {
      bodyObserver.disconnect();
      bodyObserver = null;
    }

    if (dialogObserver) {
      dialogObserver.disconnect();
      dialogObserver = null;
    }

    if (currentTopLayerElement) {
      moveShadowHostToBody();
    }

    currentTopLayerElement = null;
    originalParent = null;
  };

  return { cleanup };
};

export default topLayerManager;
