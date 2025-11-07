// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { useState, useRef, useEffect } from 'react';
import useScrollPosition from '@/entrypoints/popup/hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import DisconnectIcon from '@/assets/popup-window/disconnect-device.svg?react';
import { getCurrentDevice } from '@/partials/functions';
import ConfirmDialog from '@/entrypoints/popup/components/ConfirmDialog';

/**
* Function to render the Settings Trusted Devices component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsDevices (props) {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chosenDeviceId, setChosenDeviceId] = useState(null);

  const scrollableRef = useRef(null);

  useScrollPosition(scrollableRef, loading);

  const generatePlatformName = platform => {
    switch (platform) {
      case 'android': return 'Android';
      case 'ios': return 'iOS';
      default: return browser.i18n.getMessage('settings_devices_unknown_platform');
    }
  };

  const generateDevicesList = () => {
    if (devices.length === 0 && !loading) {
      return <p className={S.settingsDevicesListEmpty}>{browser.i18n.getMessage('settings_devices_no_devices')}</p>;
    }

    return devices.map(device => (
      <div
        key={device.id}
        className={`${S.settingsDevicesListItem} ${device.id === currentDevice?.id ? S.currentDevice : ''}`}
        title={device.id === currentDevice?.id ? browser.i18n.getMessage('settings_devices_current_device_title') : ''}
      >
        <div className={S.settingsDevicesListItemContent}>
          <h5><strong>{browser.i18n.getMessage('settings_devices_name_header')}: </strong>{device.name}</h5>
          <h6><strong>{browser.i18n.getMessage('settings_devices_platform_header')}: </strong>{generatePlatformName(device.platform)}</h6>
          <p><strong>{browser.i18n.getMessage('settings_devices_last_connected_header')}: </strong>{new Date(device.updatedAt).toLocaleString()}</p>
        </div>
        {currentDevice?.id !== device.id && (
          <div className={S.settingsDevicesListItemActions}>
            <button
              className={S.settingsDevicesListItemActionsRemove}
              title={browser.i18n.getMessage('settings_devices_disconnect_title')}
              onClick={() => showConfirmDialog(device.id)}
            >
              <DisconnectIcon />
            </button>
          </div>
        )}
      </div>
    ));
  };

  const removeDevice = async deviceId => {
    setLoading(true);
    const newDevices = await storage.getItem('local:devices') || [];
    const filteredDevices = newDevices.filter(device => device?.id && device?.id?.length > 0);
    const sortedDevices = filteredDevices.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const updatedDevices = sortedDevices.filter(device => device.id !== deviceId);
    await storage.setItem('local:devices', updatedDevices);
    setDevices(updatedDevices);
    setLoading(false);
  };

  const showConfirmDialog = deviceId => {
    setDialogOpen(true);
    setChosenDeviceId(deviceId);
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
    setChosenDeviceId(null);
  };

  const handleDialogConfirm = async () => {
    if (chosenDeviceId) {
      await removeDevice(chosenDeviceId);
    }

    setDialogOpen(false);
    setChosenDeviceId(null);
  };

  useEffect(() => {
    storage.getItem('local:devices')
      .then(devices => devices.filter(device => device?.id && device?.id?.length > 0))
      .then(devices => devices.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
      .then(devices => {
        setDevices(devices || []);
        return getCurrentDevice();
      })
      .then(cD => {
        setCurrentDevice(cD);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return null;
  }

  return (
    <>
      <div className={`${props.className ? props.className : ''}`}>
        <div ref={scrollableRef}>
          <section className={S.settings}>
            <NavigationButton type='back' />
            <NavigationButton type='cancel' />

            <div className={`${S.settingsContainer} ${S.submenuContainer}`}>
              <div className={S.settingsSubmenu}>
                <div className={S.settingsSubmenuHeader}>
                  <h3>{browser.i18n.getMessage('settings_devices_header')}</h3>
                </div>
      
                <div className={S.settingsSubmenuBody}>
                  <div className={S.settingsDevices}>
                    <h4>{browser.i18n.getMessage('settings_devices_description')}</h4>
                    <div className={S.settingsDevicesList}>
                      {generateDevicesList()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog 
        open={dialogOpen}
        message={browser.i18n.getMessage('settings_devices_dialog_message')}
        subMessage={currentDevice?.id === chosenDeviceId ? browser.i18n.getMessage('settings_devices_dialog_submessage_current_device') : null}
        cancelText={browser.i18n.getMessage('settings_devices_dialog_cancel_text')}
        confirmText={browser.i18n.getMessage('settings_devices_dialog_confirm_text')}
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}

export default SettingsDevices;
