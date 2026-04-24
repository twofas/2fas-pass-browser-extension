// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@splidejs/react-splide/css/core';
import S from './Connect.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useEffect, useCallback, useRef, memo, lazy } from 'react';
import { motion } from 'motion/react';
import { useAuthActions } from '@/hooks/useAuth';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import DeviceQrIcon from '@/assets/popup-window/device-qr.svg?react';
import QR from './components/QR';
import DeviceNew from './components/DeviceNew';
import DeviceIcon from './components/DeviceIcon';
import DevicesPagination from './components/DevicesPagination';
import { getReadyDevices, renderQrFromData } from './functions';
import NavigationButton from '../../components/NavigationButton';
import { CONNECT_VIEWS } from '@/constants';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import usePopupState from '../../store/popupState/usePopupState';
import { useI18n } from '@/partials/context/I18nContext';
import ChevronIcon from '@/assets/popup-window/chevron2.svg?react';

const PushNotification = lazy(() => import('../Fetch/components/PushNotification'));

const viewVariants = {
  visible: { opacity: 1, borderWidth: '1px', pointerEvents: 'auto' },
  hidden: { opacity: 0, borderWidth: '0px', pointerEvents: 'none' }
};

function Connect (props) {
  const { getMessage } = useI18n();
  const { login } = useAuthActions();
  const { wsState: bgState, sendCommand } = useBackgroundWS({ onLogin: login });
  const [localView, setLocalView] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [readyDevices, setReadyDevices] = useState([]);
  const [sliderMounted, setSliderMounted] = useState(false);
  const sliderRef = useRef(null);
  const initDoneRef = useRef(false);

  const { data, setData } = usePopupState();

  const rawConnectView = bgState?.active ? (bgState.connectView || localView) : localView;
  const connectView = rawConnectView === CONNECT_VIEWS.DeviceSelect && readyDevices.length === 0
    ? CONNECT_VIEWS.DeviceNew
    : rawConnectView;
  const connectingLoader = bgState?.progress ?? 264;
  const deviceName = bgState?.deviceName || null;
  const socketError = bgState?.socketError || false;

  const loadReadyDevices = useCallback(async () => {
    const devices = await getReadyDevices();
    setReadyDevices(devices);
    return devices;
  }, []);

  const updateQrCode = useCallback(async qrData => {
    const dataUrl = await renderQrFromData(qrData);
    setQrCode(dataUrl);
  }, []);

  const switchToQrView = useCallback(async () => {
    setLocalView(CONNECT_VIEWS.QrView);

    if (bgState?.active) {
      await sendCommand(REQUEST_ACTIONS.WS_CANCEL);
    }

    const result = await sendCommand(REQUEST_ACTIONS.WS_CONNECT_QR);

    if (result?.state?.qrData) {
      await updateQrCode(result.state.qrData);
    }

    if (result?.status === 'error') {
      showToast(result.message, 'error');
    }
  }, [bgState?.active, sendCommand, updateQrCode]);

  const switchToDeviceSelect = useCallback(async () => {
    if (bgState?.active) {
      await sendCommand(REQUEST_ACTIONS.WS_CANCEL);
    }

    setLocalView(CONNECT_VIEWS.DeviceSelect);
    await loadReadyDevices();
  }, [bgState?.active, sendCommand, loadReadyDevices]);

  const connectByPush = useCallback(async device => {
    if (bgState?.active) {
      await sendCommand(REQUEST_ACTIONS.WS_CANCEL);
    }

    const result = await sendCommand(REQUEST_ACTIONS.WS_CONNECT_PUSH, { deviceId: device.id });

    if (result?.status === 'busy') {
      showToast(getMessage('ws_action_in_progress'), 'info');
      return;
    }

    if (result?.status === 'error') {
      showToast(result.message, 'error');
      setLocalView(CONNECT_VIEWS.DeviceSelect);
    }
  }, [bgState?.active, sendCommand, getMessage]);

  const handleSocketReload = useCallback(async () => {
    const result = await sendCommand(REQUEST_ACTIONS.WS_RELOAD_QR);

    if (result?.state?.qrData) {
      await updateQrCode(result.state.qrData);
    }

    if (result?.status === 'error') {
      showToast(result.message, 'error');
    }
  }, [sendCommand, updateQrCode]);

  const handleCancelPushSent = useCallback(async () => {
    await sendCommand(REQUEST_ACTIONS.WS_CANCEL);
    setLocalView(CONNECT_VIEWS.DeviceSelect);
  }, [sendCommand]);

  const handleSwitchToQrFromPushSent = useCallback(async () => {
    await sendCommand(REQUEST_ACTIONS.WS_CANCEL);
    await switchToQrView();
  }, [sendCommand, switchToQrView]);

  const handleKeyboardEnterClick = useCallback(async e => {
    if (e.key === 'Enter') {
      if (connectView === CONNECT_VIEWS.DeviceSelect) {
        const currentIndex = sliderRef.current?.splide?.index || data?.connectSliderIndex || 0;

        if (readyDevices[currentIndex]) {
          await connectByPush(readyDevices[currentIndex]);
        }
      }
    }
  }, [connectView, data?.connectSliderIndex, readyDevices, connectByPush]);

  const handlePaginationClick = useCallback(index => {
    if (sliderRef.current) {
      sliderRef.current.go(index);
    }
  }, []);

  const handlePrevButton = () => {
    const currentIndex = data?.connectSliderIndex || 0;

    if (sliderRef.current && currentIndex > 0) {
      sliderRef.current.go(currentIndex - 1);
    }
  };

  const handleNextButton = () => {
    const currentIndex = data?.connectSliderIndex || 0;

    if (sliderRef.current && currentIndex < readyDevices.length - 1) {
      sliderRef.current.go(currentIndex + 1);
    }
  };

  // Render QR code when background qrData changes
  useEffect(() => {
    if (bgState?.qrData) {
      updateQrCode(bgState.qrData);
    }
  }, [bgState?.qrData, updateQrCode]);

  // Initialize
  useEffect(() => {
    if (initDoneRef.current) {
      return;
    }

    initDoneRef.current = true;

    const init = async () => {
      await loadReadyDevices();

      if (bgState?.active && (bgState.type === 'connect_qr' || bgState.type === 'connect_push')) {
        if (bgState.qrData) {
          await updateQrCode(bgState.qrData);
        }

        return;
      }

      setLocalView(CONNECT_VIEWS.DeviceSelect);
    };

    init();
  }, [bgState?.active, bgState?.type, bgState?.qrData, loadReadyDevices, updateQrCode]);

  useEffect(() => {
    if (data?.connectSliderIndex === undefined) {
      setData('connectSliderIndex', 0);
    }

    document.addEventListener('keydown', handleKeyboardEnterClick);

    return () => {
      document.removeEventListener('keydown', handleKeyboardEnterClick);
    };
  }, [handleKeyboardEnterClick, setData, data?.connectSliderIndex]);

  useEffect(() => {
    if (sliderRef?.current && sliderRef.current.splide) {
      const splide = sliderRef.current.splide;

      if (splide.on) {
        splide.on('move', newIndex => {
          setData('connectSliderIndex', newIndex);
        });
      }

      const savedIndex = data.connectSliderIndex || 0;

      if (savedIndex > 0 && savedIndex < readyDevices.length && splide.index !== savedIndex) {
        const originalSpeed = splide.options.speed;
        splide.options.speed = 0;

        requestAnimationFrame(() => {
          splide.go(savedIndex);
        });

        requestAnimationFrame(() => {
          splide.options.speed = originalSpeed;
        });
      }
    }

    return () => {
      if (sliderRef?.current && sliderRef.current.splide && sliderRef.current.splide.off) {
        sliderRef.current.splide.off('move');
      }
    };
  }, [readyDevices, sliderMounted, setData, data.connectSliderIndex]);

  // Cleanup: cancel WS on unmount
  useEffect(() => {
    return () => {
      sendCommand(REQUEST_ACTIONS.WS_CANCEL).catch(() => {});
    };
  }, [sendCommand]);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        {/* QR View */}
        <motion.section
          className={S.connect}
          variants={viewVariants}
          initial="hidden"
          transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
          animate={connectView === CONNECT_VIEWS.QrView ? 'visible' : 'hidden'}
        >
          <div className={S.connectContainer}>
            <h1>{getMessage('connect_header')}</h1>

            <NavigationButton
              type='cancel'
              onClick={switchToDeviceSelect}
            />

            <div className={`${S.connectContainerQr} ${socketError ? S.error : ''}`}>
              <div className={S.connectContainerQrErrorContent}>
                <button className={`${bS.btn} ${bS.btnTheme} ${bS.btnQrReload}`} onClick={handleSocketReload}>{getMessage('reload')}</button>
              </div>

              <QR qrCode={qrCode} />
            </div>

            <div className={S.connectDescription}>
              <InfoIcon />
              <p>{getMessage('connect_description')}</p>
            </div>
          </div>
        </motion.section>

        {/* Device Select */}
        <motion.section
          className={S.deviceSelect}
          variants={viewVariants}
          initial="hidden"
          transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
          animate={connectView === CONNECT_VIEWS.DeviceSelect ? 'visible' : 'hidden'}
        >
          <div className={S.deviceSelectContainer}>
            <h1>{getMessage('connect_device_select_header')}</h1>
            <h2>{getMessage('connect_device_select_list_header')}</h2>

            <div className={S.deviceSelectContainerList}>
              <div className={S.deviceSelectContainerListContainer}>
                <button
                  className={`${S.deviceSelectContainerListPrev} ${readyDevices?.length > 1 && (data?.connectSliderIndex ?? 0) !== 0 ? S.visible : ''}`}
                  onClick={handlePrevButton}
                >
                  <span>
                    <ChevronIcon />
                  </span>
                </button>

                <Splide
                  className={S.deviceSelectContainerListSlider}
                  hasTrack={false}
                  onMounted={() => { setSliderMounted(true); }}
                  options={{
                    type: 'slide',
                    rewind: false,
                    width: '184px',
                    arrows: false,
                    pagination: false,
                    keyboard: 'global',
                    updateOnMove: true
                  }}
                  ref={sliderRef}
                >
                  <SplideTrack className={S.deviceSelectContainerListSliderTrack}>
                    {readyDevices.map((device, index) => (
                      <SplideSlide
                        className={S.deviceSelectContainerListSliderSlide}
                        key={index}
                      >
                        <button
                          key={index}
                          className={S.deviceSelectContainerListItem}
                          title={device?.name}
                          onClick={() => connectByPush(device)}
                        >
                          <DeviceIcon device={device} />
                          <span className={S.deviceSelectContainerListItemName}>{device?.name}</span>
                          <span className={`${S.deviceSelectContainerListItemPlatform} ${device?.platform === 'ios' ? S.ios : ''} ${device?.platform === 'android' ? S.android : ''}`}>
                            {device?.platform === 'ios' ? 'iOS' : ''}
                            {device?.platform === 'android' ? 'Android' : ''}
                          </span>
                        </button>
                      </SplideSlide>
                    ))}
                  </SplideTrack>
                </Splide>

                <button
                  className={`${S.deviceSelectContainerListNext} ${readyDevices?.length > 1 && (data?.connectSliderIndex ?? 0) !== readyDevices.length - 1 ? S.visible : ''}`}
                  onClick={handleNextButton}
                >
                  <span>
                    <ChevronIcon />
                  </span>
                </button>
              </div>

              <DevicesPagination
                devices={readyDevices}
                currentIndex={data?.connectSliderIndex ?? 0}
                onPageClick={handlePaginationClick}
              />
            </div>

            <div className={S.deviceSelectContainerAdd}>
              <button
                className={`${bS.btn} ${bS.btnClear}`}
                onClick={switchToQrView}
              >
                <span>{getMessage('connect_device_select_add_another')}</span>
                <DeviceQrIcon />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Device New */}
        <motion.section
          className={S.deviceNew}
          variants={viewVariants}
          initial="hidden"
          transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
          animate={connectView === CONNECT_VIEWS.DeviceNew ? 'visible' : 'hidden'}
        >
          <DeviceNew onConnect={switchToQrView} />
        </motion.section>

        {/* Progress */}
        <motion.section
          className={S.progress}
          variants={viewVariants}
          initial="hidden"
          transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
          animate={connectView === CONNECT_VIEWS.Progress ? 'visible' : 'hidden'}
        >
          <div className={S.progressContainer}>
            <div className={S.progressLoader}>
              <svg className={`${S.progressLoaderCircle}`} style={{ strokeDashoffset: connectingLoader }} viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
                <circle cx="48" cy="48" r="42" className={S.progressLoaderCircleBg} />
                <circle cx="48" cy="48" r="42" />
              </svg>

              <span>{getMessage('connect_connecting')}</span>
            </div>

            <div className={S.progressDescription}>
              <p>{getMessage('connect_connection_opened')}</p>
            </div>

            <div className={`${S.progressDeviceName} ${deviceName ? S.visible : ''}`}>
              <span>{deviceName}</span>
            </div>
          </div>
        </motion.section>

        {/* Push Sent */}
        <motion.section
          className={S.push}
          variants={viewVariants}
          initial="hidden"
          transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
          animate={connectView === CONNECT_VIEWS.PushSent ? 'visible' : 'hidden'}
        >
          <div className={S.pushContainer}>
            <NavigationButton
              type='cancel'
              onClick={handleCancelPushSent}
            />

            <PushNotification />

            <div className={`${S.pushDeviceName} ${deviceName ? S.visible : ''}`}>
              <span>{deviceName}</span>
            </div>

            <div className={S.pushAdditional}>
              <div className={`${S.pushAdditionalTrouble} ${bS.btn} ${bS.btnOutline}`}>
                <span>{getMessage('connect_push_trouble')}</span>

                <div className={S.pushAdditionalTooltip}>
                  <span>{getMessage('connect_push_trouble_tooltip')}</span>
                  <span>{getMessage('connect_push_trouble_tooltip_or')}</span>
                  <button
                    className={`${bS.btn} ${bS.btnClear}`}
                    onClick={handleSwitchToQrFromPushSent}
                  >
                    <span>{getMessage('connect_push_trouble_tooltip_use_qr')}</span>
                    <DeviceQrIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default memo(Connect);
