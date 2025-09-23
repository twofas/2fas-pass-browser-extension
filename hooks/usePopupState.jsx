// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router';
import { getLastActiveTab, getCurrentDevice, generateNonce } from '@/partials/functions';
import createPopupStateObjectForTab from '@/partials/popupState/createPopupStateObjectForTab';
import getPopupStateObjectForTab from '@/partials/popupState/getPopupStateObjectForTab';
import getKey from '@/partials/sessionStorage/getKey';

const PopupStateContext = createContext();

const encryptData = async data => {
  try {
    const lKey = await storage.getItem('local:lKey');

    if (!lKey) {
      return JSON.stringify(data);
    }

    let nonce;

    try {
      nonce = await generateNonce();
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateEncryptNonceError, {
        event: e,
        additional: { func: 'encryptData - generateNonce' }
      });
    }

    const dataString = JSON.stringify(data);

    let localKeyCrypto;

    try {
      localKeyCrypto = await crypto.subtle.importKey(
        'raw',
        Base64ToArrayBuffer(lKey),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateEncryptImportKeyError, {
        event: e,
        additional: { func: 'encryptData - importKey' }
      });
    }

    let encryptedValue;

    try {
      encryptedValue = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce.ArrayBuffer },
        localKeyCrypto,
        StringToArrayBuffer(dataString)
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateEncryptError, {
        event: e,
        additional: { func: 'encryptData - encrypt' }
      });
    }

    const combined = EncryptBytes(nonce.ArrayBuffer, encryptedValue);

    return ArrayBufferToBase64(combined);
  } catch (error) {
    CatchError(error);
    return JSON.stringify(data);
  }
};

const decryptData = async encryptedData => {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return {};
    }

    const lKey = await storage.getItem('local:lKey');

    if (!lKey) {
      try {
        return JSON.parse(encryptedData);
      } catch {
        return {};
      }
    }

    const combined = Base64ToArrayBuffer(encryptedData);
    const { iv: nonce, data: ciphertext } = DecryptBytes(combined);

    let localKeyCrypto;

    try {
      localKeyCrypto = await crypto.subtle.importKey(
        'raw',
        Base64ToArrayBuffer(lKey),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateDecryptImportKeyError, {
        event: e,
        additional: { func: 'decryptData - importKey' }
      });
    }

    let decryptedValue;
    
    try {
      decryptedValue = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        localKeyCrypto,
        ciphertext
      );
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateDecryptError, {
        event: e,
        additional: { func: 'decryptData - decrypt' }
      });
    }

    const dataString = ArrayBufferToString(decryptedValue);

    return JSON.parse(dataString);
  } catch (error) {
    CatchError(error);

    try {
      return JSON.parse(encryptedData);
    } catch {
      return {};
    }
  }
};

const ignoredRoutePrefixes = [
  '/blocked',
  '/connect',
  '/fetch'
];

const isIgnoredRoute = pathname => {
  return ignoredRoutePrefixes.some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );
};

/** 
* Function to provide popup state context.
* @param {ReactNode} children - The child components.
* @return {JSX.Element} The context provider.
*/
export const PopupStateProvider = ({ children }) => {
  const { pathname } = useLocation();
  const [popupState, setPopupState] = useState({});
  const [popupStateData, setPopupStateData] = useState(null);
  const previousTabRef = useRef(null);
  const scrollElementRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const storageDebounceTimerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastPathnameRef = useRef(pathname);
  const popupStateKeyRef = useRef(null);

  const getTab = useCallback(async () => {
    try {
      return await getLastActiveTab();
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateGetTabError, {
        event: e,
        additional: { func: 'getTab' }
      });
    }
  }, []);

  const getPopupStateKey = useCallback(async () => {
    if (popupStateKeyRef.current) {
      return popupStateKeyRef.current;
    }

    try {
      let device;

      try {
        device = await getCurrentDevice();
      } catch {}

      if (!device?.uuid) {
        return null;
      }

      const key = await getKey('popup_state', { uuid: device.uuid });
      popupStateKeyRef.current = key;

      return key;
    } catch (error) {
      throw new TwoFasError(TwoFasError.internalErrors.popupStateGetKeyError, {
        event: error,
        additional: { func: 'getPopupStateKey' }
      });
    }
  }, []);

  const getPopupState = useCallback(async () => {
    try {
      const extURL = browser.runtime.getURL('/popup.html');
      const isPopupTab = tab => tab.url === extURL;

      const targetTab = await getLastActiveTab(
        null,
        tab => !isPopupTab(tab)
      );

      if (!targetTab || !targetTab.id) {
        return null;
      }

      const storageKey = await getPopupStateKey();

      if (!storageKey) {
        return null;
      }

      let allPopupStates;
      try {
        allPopupStates = await storage.getItem(`session:${storageKey}`);
      } catch (e) {
        throw new TwoFasError(TwoFasError.internalErrors.popupStateStorageError, {
          event: e,
          additional: { func: 'getPopupState - getItem' }
        });
      }

      const tabPopupState = allPopupStates?.[targetTab.id];

      if (!tabPopupState) {
        return null;
      }

      const decryptedData = await decryptData(tabPopupState.data);

      return {
        ...tabPopupState,
        data: decryptedData
      };
    } catch (error) {
      CatchError(error);
      return null;
    }
  }, [getPopupStateKey]);

  const onScroll = useCallback(e => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setPopupState(prev => {
        if (prev.scrollPosition === e.target.scrollTop) {
          return prev;
        }

        return {
          ...prev,
          scrollPosition: e.target.scrollTop
        };
      });
    }, 100);
  }, []);

  useEffect(() => {
    if (isIgnoredRoute(pathname)) {
      setPopupState({ scrollPosition: 0, data: {}, href: '/' });
      setPopupStateData({ scrollPosition: 0, data: {}, href: '/' });
      return;
    }

    const shouldUpdate = !isInitializedRef.current || lastPathnameRef.current !== pathname;
    
    if (!shouldUpdate) {
      return;
    }

    lastPathnameRef.current = pathname;
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      getTab()
        .then(tab => {
          if (!tab) {
            return;
          }

          const tabChanged = previousTabRef?.current?.id !== tab.id;
          
          if (tabChanged) {
            previousTabRef.current = tab;
            createPopupStateObjectForTab(tab.id);
          }

          getPopupStateObjectForTab(tab.id)
            .then(state => {
              if (state) {
                setPopupState(state);
              }
            });
        });
    } else {
      getTab()
        .then(tab => {
          if (!tab) {
            return;
          }

          const tabChanged = previousTabRef?.current?.id !== tab.id;
          
          if (tabChanged) {
            previousTabRef.current = tab;
            getPopupStateObjectForTab(tab.id)
              .then(state => {
                if (state) {
                  setPopupState(state);
                }
              });
          }
        });
    }
  }, [pathname, getTab]);

  useEffect(() => {
    getPopupState().then(state => {
      if (state) {
        setPopupStateData(state);
      }
    });
  }, [getPopupState]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hasPopupState = popupState && Object.keys(popupState).length > 0;
    
    if (!previousTabRef.current || !hasPopupState) {
      return;
    }

    if (storageDebounceTimerRef.current) {
      clearTimeout(storageDebounceTimerRef.current);
    }

    storageDebounceTimerRef.current = setTimeout(async () => {
      const tabId = previousTabRef.current?.id;

      if (!tabId) {
        return;
      }

      const storageKey = await getPopupStateKey();

      if (!storageKey) {
        return;
      }

      let sessionPopupState;
      try {
        sessionPopupState = await storage.getItem(`session:${storageKey}`) || {};
      } catch (e) {
        throw new TwoFasError(TwoFasError.internalErrors.popupStateStorageError, {
          event: e,
          additional: { func: 'useEffect - getItem' }
        });
      }

      const encryptedData = await encryptData(popupState.data || {});
      const popupStateToSave = {
        ...popupState,
        data: encryptedData
      };

      if (JSON.stringify(sessionPopupState[tabId]) !== JSON.stringify(popupStateToSave)) {
        sessionPopupState[tabId] = popupStateToSave;
        try {
          await storage.setItem(`session:${storageKey}`, sessionPopupState);
        } catch (e) {
          throw new TwoFasError(TwoFasError.internalErrors.popupStateStorageError, {
            event: e,
            additional: { func: 'useEffect - setItem' }
          });
        }
      }
    }, 150);

    return () => {
      if (storageDebounceTimerRef.current) {
        clearTimeout(storageDebounceTimerRef.current);
      }
    };
  }, [popupState, getPopupStateKey]);

  const setScrollElementRef = useCallback(element => {
    const prevElement = scrollElementRef.current;
    
    if (prevElement && prevElement._scrollHandler) {
      prevElement.removeEventListener('scroll', prevElement._scrollHandler);
      delete prevElement._scrollHandler;
    }
    
    scrollElementRef.current = element;
    
    if (element && element !== prevElement) {
      element._scrollHandler = onScroll;
      element.addEventListener('scroll', onScroll, { passive: true });
    }
  }, [onScroll]);

  const setHref = useCallback(href => {
    setPopupState(prev => {
      if (prev.href === href) {
        return prev;
      }

      return {
        ...prev,
        href,
        scrollPosition: 0,
        data: {}
      };
    });

    setPopupStateData(prev => {
      const shouldKeepScroll = prev?.href === href;

      if (!prev) {
        return { href, scrollPosition: 0, data: {} };
      }

      return {
        ...prev,
        href,
        scrollPosition: shouldKeepScroll ? prev.scrollPosition : 0,
        data: shouldKeepScroll ? prev.data : {}
      };
    });
  }, []);

  const shouldRestoreScroll = useMemo(() => popupStateData?.href === pathname, [popupStateData?.href, pathname]);

  const setData = useCallback(data => {
    setPopupState(prev => {
      const newData = typeof data === 'function' ? data(prev.data || {}) : data;

      if (JSON.stringify(prev.data) === JSON.stringify(newData)) {
        return prev;
      }

      return {
        ...prev,
        data: newData
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      setScrollElementRef,
      scrollElementRef,
      getPopupState,
      popupStateData,
      setPopupStateData,
      setHref,
      shouldRestoreScroll,
      setData,
      popupState
    }),
    [setScrollElementRef, getPopupState, popupStateData, setHref, shouldRestoreScroll, setData, popupState]
  );

  return <PopupStateContext.Provider value={value}>{children}</PopupStateContext.Provider>;
};

export const usePopupState = () => {
  return useContext(PopupStateContext);
};
