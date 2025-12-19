// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLastActiveTab } from '@/partials/functions';
import getKey from '@/partials/sessionStorage/getKey';
import getLocalKey from '@/entrypoints/background/utils/getLocalKey';
import encryptPopupState from './encryptPopupState';
import decryptPopupState from './decryptPopupState';

const isDev = import.meta.env.DEV;

/**
* Store for popup state management using Zustand with persistence.
* This store manages various sections of the popup state, including tabs, details, settings, and password generator.
* The state is persisted in session storage, scoped by the active browser tab and pathname.
* Data is encrypted using local key with AES-GCM for security (skipped in development mode).
* Storage structure: { tabId: { pathname: "encryptedStateString" } } with pathname-scoped data.
* Optimized for performance with parallel async operations and explicit garbage collection.
* @return {object} The Zustand store for popup state management.
*/
const MAX_HREF_HISTORY = 20;

const usePopupStateStore = create(
  persist(
    (set, get) => ({
      href: [],
      setHref: pathname => set(state => {
        const currentHref = state.href;

        if (currentHref[currentHref.length - 1] === pathname) {
          return state;
        }

        const newHref = [...currentHref, pathname].slice(-MAX_HREF_HISTORY);
        return { href: newHref };
      }),
      popHref: () => set(state => {
        if (state.href.length <= 1) {
          return { href: [] };
        }

        return { href: state.href.slice(0, -1) };
      }),
      getLastHref: () => {
        const href = get().href;
        return href.length > 0 ? href[href.length - 1] : null;
      },
      getPreviousHref: () => {
        const href = get().href;
        return href.length >= 2 ? href[href.length - 2] : null;
      },
      clearHref: () => set({ href: [] }),
      pathData: {},
      getData: pathname => get().pathData[pathname]?.data || {},
      setData: (pathname, name, data) => set(state => {
        const newPathData = { ...state.pathData };
        const currentPathState = newPathData[pathname] || { data: {}, scrollPosition: 0 };
        const newData = { ...currentPathState.data };
        newData[name] = data;
        newPathData[pathname] = { ...currentPathState, data: newData };
        return { pathData: newPathData };
      }),
      setBatchData: (pathname, updates) => set(state => {
        const newPathData = { ...state.pathData };
        const currentPathState = newPathData[pathname] || { data: {}, scrollPosition: 0 };
        const newData = { ...currentPathState.data, ...updates };
        newPathData[pathname] = { ...currentPathState, data: newData };
        return { pathData: newPathData };
      }),
      clearData: pathname => set(state => {
        const newPathData = { ...state.pathData };
        const currentPathState = newPathData[pathname] || { data: {}, scrollPosition: 0 };
        newPathData[pathname] = { ...currentPathState, data: {} };
        return { pathData: newPathData };
      }),
      clearAllData: () => set({ pathData: {} }),
      getScrollPosition: pathname => get().pathData[pathname]?.scrollPosition || 0,
      setScrollPosition: (pathname, position) => set(state => {
        const newPathData = { ...state.pathData };
        const currentPathState = newPathData[pathname] || { data: {}, scrollPosition: 0 };
        newPathData[pathname] = { ...currentPathState, scrollPosition: position };
        return { pathData: newPathData };
      }),
    }),
    {
      name: 'popupState',
      skipHydration: true,
      storage: (() => {
        let writeQueue = Promise.resolve();

        return {
        async getItem (name) {
          let activeTab = null;
          let tabId = null;
          let popupStateKey = null;
          let storageKey = null;
          let storedState = null;
          let localKey = null;
          let decryptedState = null;
          let result = null;

          try {
            if (isDev) {
              [activeTab, popupStateKey] = await Promise.all([
                getLastActiveTab(),
                getKey('popup_state')
              ]);
            } else {
              [activeTab, popupStateKey, localKey] = await Promise.all([
                getLastActiveTab(),
                getKey('popup_state'),
                getLocalKey()
              ]);

              if (!localKey) {
                return null;
              }
            }

            tabId = activeTab?.id || 'default';
            storageKey = `session:${popupStateKey}`;

            const allTabsData = await storage.getItem(storageKey);

            if (!allTabsData?.[tabId]) {
              return null;
            }

            storedState = allTabsData[tabId];

            if (isDev) {
              decryptedState = storedState;
            } else {
              decryptedState = await decryptPopupState(storedState, localKey);
            }

            if (!decryptedState) {
              return null;
            }

            result = decryptedState[name] || null;
            return result;
          } catch (e) {
            CatchError(e);
            return null;
          } finally {
            activeTab = null;
            tabId = null;
            popupStateKey = null;
            storageKey = null;
            storedState = null;
            localKey = null;
            decryptedState = null;
            result = null;
          }
        },
        setItem (name, value) {
          writeQueue = writeQueue.then(() => this._doSetItem(name, value)).catch(e => CatchError(e));
          return writeQueue;
        },
        async _doSetItem (name, value) {
          let activeTab = null;
          let tabId = null;
          let popupStateKey = null;
          let storageKey = null;
          let allTabsData = null;
          let localKey = null;
          let existingStored = null;
          let existingState = null;
          let newState = null;
          let stateToStore = null;

          try {
            if (isDev) {
              [activeTab, popupStateKey] = await Promise.all([
                getLastActiveTab(),
                getKey('popup_state')
              ]);
            } else {
              [activeTab, popupStateKey, localKey] = await Promise.all([
                getLastActiveTab(),
                getKey('popup_state'),
                getLocalKey()
              ]);

              if (!localKey) {
                return;
              }
            }

            tabId = activeTab?.id || 'default';
            storageKey = `session:${popupStateKey}`;

            allTabsData = await storage.getItem(storageKey) || {};

            existingStored = allTabsData[tabId];

            if (existingStored) {
              if (isDev) {
                existingState = existingStored;
              } else {
                existingState = await decryptPopupState(existingStored, localKey);
              }
            }

            newState = existingState ? { ...existingState } : {};
            newState[name] = value;

            if (isDev) {
              stateToStore = newState;
            } else {
              stateToStore = await encryptPopupState(newState, localKey);

              if (!stateToStore) {
                return;
              }
            }

            allTabsData[tabId] = stateToStore;
            await storage.setItem(storageKey, allTabsData);
          } catch (e) {
            CatchError(e);
          } finally {
            activeTab = null;
            tabId = null;
            popupStateKey = null;
            storageKey = null;
            allTabsData = null;
            localKey = null;
            existingStored = null;
            existingState = null;
            newState = null;
            stateToStore = null;
          }
        },
        async removeItem (name) {
          let activeTab = null;
          let tabId = null;
          let popupStateKey = null;
          let storageKey = null;
          let allTabsData = null;
          let localKey = null;
          let existingStored = null;
          let existingState = null;
          let stateToStore = null;

          try {
            if (isDev) {
              [activeTab, popupStateKey] = await Promise.all([
                getLastActiveTab(),
                getKey('popup_state')
              ]);
            } else {
              [activeTab, popupStateKey, localKey] = await Promise.all([
                getLastActiveTab(),
                getKey('popup_state'),
                getLocalKey()
              ]);

              if (!localKey) {
                return;
              }
            }

            tabId = activeTab?.id || 'default';
            storageKey = `session:${popupStateKey}`;

            allTabsData = await storage.getItem(storageKey) || {};

            existingStored = allTabsData[tabId];

            if (!existingStored) {
              return;
            }

            if (isDev) {
              existingState = existingStored;
            } else {
              existingState = await decryptPopupState(existingStored, localKey);
            }

            if (!existingState?.[name]) {
              return;
            }

            delete existingState[name];

            if (Object.keys(existingState).length === 0) {
              delete allTabsData[tabId];
            } else {
              if (isDev) {
                stateToStore = existingState;
              } else {
                stateToStore = await encryptPopupState(existingState, localKey);

                if (!stateToStore) {
                  return;
                }
              }

              allTabsData[tabId] = stateToStore;
            }

            await storage.setItem(storageKey, allTabsData);
          } catch (e) {
            CatchError(e);
          } finally {
            activeTab = null;
            tabId = null;
            popupStateKey = null;
            storageKey = null;
            allTabsData = null;
            localKey = null;
            existingStored = null;
            existingState = null;
            stateToStore = null;
          }
        }
      };
      })()
    }
  )
);

export default usePopupStateStore;
