// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLastActiveTab } from '@/partials/functions';

/** 
* Store for popup state management using Zustand with persistence.
* This store manages various sections of the popup state, including tabs, details, settings, and password generator.
* The state is persisted in session storage, scoped by the active browser tab.
* @return {object} The Zustand store for popup state management.
*/
const usePopupStateStore = create(
  persist(
    set => ({
      href: '',
      setHref: href => set({ href }),
      data: {},
      setData: (name, data) => set(state => ({ data: { ...state.data, [name]: data } })),
      scrollPosition: 0,
      setScrollPosition: position => set({ scrollPosition: position }),
    }),
    {
      name: 'popupState',
      storage: {
        async getItem (name) {
          let newStructure = false;

          // Tab
          const activeTab = await getLastActiveTab();
          const tabId = activeTab?.id || 'default';

          // Storage
          let storageValue = await storage.getItem('session:popupState');

          if (!storageValue) {
            storageValue = {};
            newStructure = true;
          }

          if (!storageValue?.[tabId]) {
            storageValue[tabId] = {};
            newStructure = true;
          }

          if (newStructure) {
            await storage.setItem('session:popupState', storageValue);
          }

          return storageValue?.[tabId]?.[name] || null;
        },
        async setItem (name, storageValue) {
          // Tab
          const activeTab = await getLastActiveTab();
          const tabId = activeTab?.id || 'default';

          // Storage
          const currentStorage = await storage.getItem('session:popupState') || {};

          if (!currentStorage?.[tabId]) {
            currentStorage[tabId] = {};
          }

          currentStorage[tabId][name] = storageValue;
          return storage.setItem('session:popupState', currentStorage);
        },
        async removeItem (name) {
          // Tab
          const activeTab = await getLastActiveTab();
          const tabId = activeTab?.id || 'default';

          // Storage
          const currentStorage = await storage.getItem('session:popupState') || {};

          if (currentStorage?.[tabId] && currentStorage[tabId]?.[name]) {
            delete currentStorage[tabId][name];

            if (Object.keys(currentStorage[tabId]).length <= 0) {
              delete currentStorage[tabId];
            }

            await storage.setItem('session:popupState', currentStorage);
          }

          return;
        }
      }
    }
  )
);

export default usePopupStateStore;
