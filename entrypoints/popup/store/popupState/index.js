import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLastActiveTab } from '@/partials/functions';

const usePopupStateStore = create(
  persist(
    set => ({
      thisTab: {},
      setThisTab: data => set({ thisTab: data }),
      details: {},
      setDetails: data => set({ details: data }),
      addNew: {},
      setAddNew: data => set({ addNew: data }),
      settingsAbout: {},
      setSettingsAbout: data => set({ settingsAbout: data }),
      settingsPreferences: {},
      setSettingsPreferences: data => set({ settingsPreferences: data }),
      settingsSecurity: {},
      setSettingsSecurity: data => set({ settingsSecurity: data }),
      settingsReset: {},
      setSettingsReset: data => set({ settingsReset: data }),
      settingsSaveLoginExcludedDomains: {},
      setSettingsSaveLoginExcludedDomains: data => set({ settingsSaveLoginExcludedDomains: data }),
      passwordGenerator: {},
      setPasswordGenerator: data => set({ passwordGenerator: data }),
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
