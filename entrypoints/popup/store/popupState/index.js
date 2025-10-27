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

/**
* Store for popup state management using Zustand with persistence.
* This store manages various sections of the popup state, including tabs, details, settings, and password generator.
* The state is persisted in session storage, scoped by the active browser tab.
* Data is encrypted using local key with AES-GCM for security.
* Storage structure: { tabId: "encryptedStateString" } without intermediate property names.
* Optimized for performance with parallel async operations and explicit garbage collection.
* @return {object} The Zustand store for popup state management.
*/
const usePopupStateStore = create(
  persist(
    set => ({
      href: '',
      setHref: href => set({ href }),
      data: {},
      setData: (name, data) => set(state => {
        const newData = { ...state.data };
        newData[name] = data;
        return { data: newData };
      }),
      scrollPosition: 0,
      setScrollPosition: position => set({ scrollPosition: position }),
    }),
    {
      name: 'popupState',
      skipHydration: false,
      storage: {
        async getItem (name) {
          let activeTab = null;
          let tabId = null;
          let popupStateKey = null;
          let storageKey = null;
          let encryptedState = null;
          let localKey = null;
          let decryptedState = null;
          let result = null;

          try {
            [activeTab, popupStateKey, localKey] = await Promise.all([
              getLastActiveTab(),
              getKey('popup_state'),
              getLocalKey()
            ]);

            if (!localKey) {
              return null;
            }

            tabId = activeTab?.id || 'default';
            storageKey = `session:${popupStateKey}`;
            const allTabsData = await storage.getItem(storageKey);

            if (!allTabsData?.[tabId]) {
              return null;
            }

            encryptedState = allTabsData[tabId];
            decryptedState = await decryptPopupState(encryptedState, localKey);

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
            encryptedState = null;
            localKey = null;
            decryptedState = null;
            result = null;
          }
        },
        async setItem (name, value) {
          let activeTab = null;
          let tabId = null;
          let popupStateKey = null;
          let storageKey = null;
          let allTabsData = null;
          let localKey = null;
          let existingEncrypted = null;
          let existingState = null;
          let newState = null;
          let encryptedState = null;

          try {
            [activeTab, popupStateKey, localKey] = await Promise.all([
              getLastActiveTab(),
              getKey('popup_state'),
              getLocalKey()
            ]);

            if (!localKey) {
              return;
            }

            tabId = activeTab?.id || 'default';
            storageKey = `session:${popupStateKey}`;
            allTabsData = await storage.getItem(storageKey) || {};

            existingEncrypted = allTabsData[tabId];

            if (existingEncrypted) {
              existingState = await decryptPopupState(existingEncrypted, localKey);
            }

            newState = existingState ? { ...existingState } : {};
            newState[name] = value;

            encryptedState = await encryptPopupState(newState, localKey);

            if (!encryptedState) {
              return;
            }

            allTabsData[tabId] = encryptedState;
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
            existingEncrypted = null;
            existingState = null;
            newState = null;
            encryptedState = null;
          }
        },
        async removeItem (name) {
          let activeTab = null;
          let tabId = null;
          let popupStateKey = null;
          let storageKey = null;
          let allTabsData = null;
          let localKey = null;
          let existingEncrypted = null;
          let existingState = null;
          let encryptedState = null;

          try {
            [activeTab, popupStateKey, localKey] = await Promise.all([
              getLastActiveTab(),
              getKey('popup_state'),
              getLocalKey()
            ]);

            if (!localKey) {
              return;
            }

            tabId = activeTab?.id || 'default';
            storageKey = `session:${popupStateKey}`;
            allTabsData = await storage.getItem(storageKey) || {};

            existingEncrypted = allTabsData[tabId];

            if (!existingEncrypted) {
              return;
            }

            existingState = await decryptPopupState(existingEncrypted, localKey);

            if (!existingState?.[name]) {
              return;
            }

            delete existingState[name];

            if (Object.keys(existingState).length === 0) {
              delete allTabsData[tabId];
            } else {
              encryptedState = await encryptPopupState(existingState, localKey);

              if (!encryptedState) {
                return;
              }

              allTabsData[tabId] = encryptedState;
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
            existingEncrypted = null;
            existingState = null;
            encryptedState = null;
          }
        }
      }
    }
  )
);

export default usePopupStateStore;
