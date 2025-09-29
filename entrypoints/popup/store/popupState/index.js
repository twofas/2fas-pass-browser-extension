import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLastActiveTab } from '@/partials/functions';

const usePopupStateStore = create(
  persist(
    set => ({
      thisTab: {},
      setThisTab: (name, data) => set(state => ({ thisTab: { ...state.thisTab, [name]: data } })),
      details: {},
      setDetails: (name, data) => set(state => ({ details: { ...state.details, [name]: data } })),
      addNew: {},
      setAddNew: (name, data) => set(state => ({ addNew: { ...state.addNew, [name]: data } })),
      settingsAbout: {},
      setSettingsAbout: (name, data) => set(state => ({ settingsAbout: { ...state.settingsAbout, [name]: data } })),
      settingsPreferences: {},
      setSettingsPreferences: (name, data) => set(state => ({ settingsPreferences: { ...state.settingsPreferences, [name]: data } })),
      settingsSecurity: {},
      setSettingsSecurity: (name, data) => set(state => ({ settingsSecurity: { ...state.settingsSecurity, [name]: data } })),
      settingsReset: {},
      setSettingsReset: (name, data) => set(state => ({ settingsReset: { ...state.settingsReset, [name]: data } })),
      settingsSaveLoginExcludedDomains: {},
      setSettingsSaveLoginExcludedDomains: (name, data) => set(state => ({ settingsSaveLoginExcludedDomains: { ...state.settingsSaveLoginExcludedDomains, [name]: data } })),
      passwordGenerator: {},
      setPasswordGenerator: (name, data) => set(state => ({ passwordGenerator: { ...state.passwordGenerator, [name]: data } })),
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
