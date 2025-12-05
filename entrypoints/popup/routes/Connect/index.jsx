// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Connect.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useEffect, useCallback, useRef, memo, lazy } from 'react';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useAuthActions } from '@/hooks/useAuth';
import useConnectView from '../../hooks/useConnectView';
import { generateSessionKeysNonces, generateEphemeralKeys, generateSessionID, calculateConnectSignature, generateQR } from './functions';
import calculateFetchSignature from '../Fetch/functions/calculateFetchSignature';
import ConnectOnMessage from './socket/ConnectOnMessage';
import ConnectOnClose from './socket/ConnectOnClose';
import TwoFasWebSocket from '@/partials/WebSocket';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import DeviceQrIcon from '@/assets/popup-window/device-qr.svg?react';
import QR from './components/QR';
import NavigationButton from '../../components/NavigationButton';
import { getNTPTime, sendPush, networkTest } from '@/partials/functions';
import { PULL_REQUEST_TYPES, SOCKET_PATHS, CONNECT_VIEWS } from '@/constants';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import usePopupStateStore from '../../store/popupState';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const PushNotification = lazy(() => import('../Fetch/components/PushNotification'));
const IphoneIconLight = lazy(() => import('@/assets/popup-window/device-select/device-iphone-light.svg?react'));
const IphoneIconDark = lazy(() => import('@/assets/popup-window/device-select/device-iphone-dark.svg?react'));
const AndroidIconLight = lazy(() => import('@/assets/popup-window/device-select/device-android-light.svg?react'));
const AndroidIconDark = lazy(() => import('@/assets/popup-window/device-select/device-android-dark.svg?react'));
const IpadIconLight = lazy(() => import('@/assets/popup-window/device-select/device-ipad-light.svg?react'));
const IpadIconDark = lazy(() => import('@/assets/popup-window/device-select/device-ipad-dark.svg?react'));
const AndroidTabletIconLight = lazy(() => import('@/assets/popup-window/device-select/device-android-tablet-light.svg?react'));
const AndroidTabletIconDark = lazy(() => import('@/assets/popup-window/device-select/device-android-tablet-dark.svg?react'));
const ChevronIcon = lazy(() => import('@/assets/popup-window/chevron2.svg?react'));

const viewVariants = {
  visible: { opacity: 1, borderWidth: '1px', pointerEvents: 'auto' },
  hidden: { opacity: 0, borderWidth: '0px', pointerEvents: 'none' }
};

/** 
* Function component that renders the Connect page.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered Connect component.
*/
function Connect (props) {
  const [qrCode, setQrCode] = useState(null);
  const [socketError, setSocketError] = useState(false);
  const [connectingLoader, setConnectingLoader] = useState(264);
  const [deviceName, setDeviceName] = useState(null);
  const [readyDevices, setReadyDevices] = useState([]);
  const [sliderMounted, setSliderMounted] = useState(false);

  const { connectView, setConnectView } = useConnectView();
  const { login } = useAuthActions();
  const closeConnectionRef = useRef(null);
  const ephemeralDataRef = useRef(null);
  const abortControllerRef = useRef(null);
  const sliderRef = useRef(null);
  const previousViewRef = useRef(null);

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const getReadyDevices = useCallback(async () => {
    const devices = await storage.getItem('local:devices') || [];
    const filteredDevices = devices.filter(device => {
      return device.scheme && device.scheme >= config.schemeThreshold &&
             device.platform && device.sessionId;
    });

    setReadyDevices(filteredDevices);

    return filteredDevices;
  }, []);

  const initEphemeralKeys = useCallback(async () => {
    await generateSessionKeysNonces();
    ephemeralDataRef.current = await generateEphemeralKeys();
  }, []);

  const initQRConnection = useCallback(async () => {
    let sessionID, signature, qr, socket;

    try {
      sessionID = await generateSessionID();
      signature = await calculateConnectSignature(ephemeralDataRef.current.publicKey, sessionID);
      qr = await generateQR(ephemeralDataRef.current.publicKey, sessionID, signature);
    } catch (e) {
      await CatchError(e, () => {
        setSocketError(true);
        showConnectToast({ message: browser.i18n.getMessage('error_general'), type: 'error' });
        setConnectingLoader(264);
      });

      return;
    }

    let socketCreated = false;

    for (let i = 0; i < 5; i++) {
      try {
        socket = new TwoFasWebSocket(sessionID);
        socketCreated = true;
        break;
      } catch (e) {
        if (e?.name === 'TwoFasError' && e?.code === 9041) {
          const tempSocket = TwoFasWebSocket.getInstance();

          if (tempSocket) {
            tempSocket.close(1000, 'Recreating socket');
          }
        }

        if (i < 4) {
          await new Promise(res => setTimeout(res, 250));
        }
      }
    }

    if (!socketCreated) {
      setSocketError(true);
      showConnectToast({ message: browser.i18n.getMessage('error_general'), type: 'error' });
      setConnectingLoader(264);
      return;
    }

    try {
      socket.open();
      socket.addEventListener('message', ConnectOnMessage, { uuid: ephemeralDataRef.current.uuid, path: SOCKET_PATHS.CONNECT.QR });
      socket.addEventListener('close', ConnectOnClose, { path: SOCKET_PATHS.CONNECT.QR });
      setQrCode(qr);
    } catch {
      setSocketError(true);
      showConnectToast({ message: browser.i18n.getMessage('error_general'), type: 'error' });
      setConnectingLoader(264);
    }
  }, []);

  const handleSocketReload = useCallback(async () => {
    try {
      await initEphemeralKeys();
      await initQRConnection();
      setSocketError(false);
    } catch {
      // Error handling in initQRConnection and initEphemeralKeys
    }
  }, [initEphemeralKeys, initQRConnection]);

  const showConnectToast = useCallback(({ message, type }) => {
    showToast(message, type);
  }, []);

  const connectByPush = useCallback(async (device, abortSignal) => {
    if (abortSignal?.aborted) {
      return false;
    }

    try {
      setDeviceName(device?.name);
      setConnectView(CONNECT_VIEWS.PushSent);
      device.uuid = ephemeralDataRef.current.uuid;

      if (abortSignal?.aborted) {
        return false;
      }

      let sessionId, timestamp, sigPush;

      try {
        sessionId = Base64ToHex(device?.sessionId).toLowerCase();
        const timestampValue = await getNTPTime();
        timestamp = timestampValue.toString();
        sigPush = await calculateFetchSignature(sessionId, device?.id, device?.uuid, timestamp);
      } catch (e) {
        await CatchError(e);
      }

      if (abortSignal?.aborted) {
        return false;
      }

      try {
        const json = await sendPush(device, { timestamp, sigPush, messageType: 'be_request' });

        if (abortSignal?.aborted) {
          return false;
        }

        if (json?.error === 'UNREGISTERED') {
          setSocketError(true);
          showConnectToast({ message: browser.i18n.getMessage('fetch_token_unregistered_header'), type: 'error' });
          return false;
        }

        const socket = new TwoFasWebSocket(sessionId);
        socket.open();
        socket.addEventListener('message', ConnectOnMessage, { uuid: device.uuid, action: PULL_REQUEST_TYPES.FULL_SYNC, path: SOCKET_PATHS.CONNECT.PUSH });
        socket.addEventListener('close', ConnectOnClose, { path: SOCKET_PATHS.CONNECT.PUSH });
      } catch (e) {
        setConnectView(CONNECT_VIEWS.DeviceSelect);
        const toastMessage = await networkTest('error_general');
        showConnectToast({ message: browser.i18n.getMessage(toastMessage), type: 'error' });
        await CatchError(e);
      }
    } catch {
      // Error handling in nested try-catch blocks
    }
  }, [showConnectToast]);

  const handleSocketError = useCallback(value => {
    setSocketError(value);
  }, []);

  const handleKeyboardEnterClick = useCallback(async e => {
    if (e.key === 'Enter') {
      if (connectView === CONNECT_VIEWS.DeviceSelect) {
        const currentIndex = sliderRef.current?.splide?.index || data?.connectSliderIndex || 0;
        
        if (readyDevices[currentIndex]) {
          await connectByPush(readyDevices[currentIndex], abortControllerRef.current?.signal);
        }
      }
    }
  }, [connectView, data?.connectSliderIndex, readyDevices, connectByPush]);

  const handleViewSwitch = useCallback(async () => {
    const viewChanged = previousViewRef.current !== connectView;

    if (!viewChanged) {
      return;
    }

    previousViewRef.current = connectView;

    try {
      switch (connectView) {
        case CONNECT_VIEWS.QrView: {
          if (closeConnectionRef.current) {
            await closeConnectionRef.current().catch(() => {
              // Ignore close errors
            });
          }

          if (!socketError) {
            if (!ephemeralDataRef?.current?.publicKey) {
              await initEphemeralKeys();
            }

            await initQRConnection();
          }

          break;
        }

        case CONNECT_VIEWS.DeviceSelect: {
          if (closeConnectionRef.current) {
            await closeConnectionRef.current().catch(() => {
              // Ignore close errors
            });
          }

          await getReadyDevices();
          break;
        }

        default: {
          break;
        }
      }
    } catch {
      // Error handling in nested functions
    }
  }, [connectView, socketError, initEphemeralKeys, initQRConnection, getReadyDevices]);

  const generateDeviceIcon = device => {
    const platform = device?.platform || 'unknown';
    const deviceType = device?.type || 'unknown';

    switch (platform) {
      case 'ios': {
        if (deviceType === 'tablet') {
          return (
            <>
              <IpadIconLight className={`${S.deviceIcon} theme-light`} />
              <IpadIconDark className={`${S.deviceIcon} theme-dark`} />
            </>
          );
        }

        return (
          <>
            <IphoneIconLight className={`${S.deviceIcon} theme-light`} />
            <IphoneIconDark className={`${S.deviceIcon} theme-dark`} />
          </>
        );
      }

      case 'android': {
        if (deviceType === 'tablet') {
          return (
            <>
              <AndroidTabletIconLight className={`${S.deviceIcon} theme-light`} />
              <AndroidTabletIconDark className={`${S.deviceIcon} theme-dark`} />
            </>
          );
        }

        return (
          <>
            <AndroidIconLight className={`${S.deviceIcon} theme-light`} />
            <AndroidIconDark className={`${S.deviceIcon} theme-dark`} />
          </>
        );
      }

      default: {
        return null;
      }
    }
  };

  const generatePagination = () => {
    if (readyDevices.length <= 1) {
      return null;
    }

    return (
      <ul
        className={S.deviceSelectContainerListPagination}
        role='tablist'
      >
        {readyDevices.map((_, index) => (
          <li key={index} role="presentation">
            <button
              className={`splide__pagination__page ${(data.connectSliderIndex ?? 0) === index ? 'is-active' : ''}`}
              type='button'
              role='tab'
              onClick={() => sliderRef.current.go(index)}
            ></button>
          </li>
        ))}
      </ul>
    );
  };

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

  useEffect(() => {
    let cleanupTimers = null;

    closeConnectionRef.current = async () => {
      try {
        const socket = TwoFasWebSocket.getInstance();

        if (socket && socket.socket.readyState !== WebSocket.CLOSED) {
          try {
            socket.close(WEBSOCKET_STATES.NORMAL_CLOSURE, 'Component unmounted');
          } catch {
            // Ignore close errors
          }

          await new Promise(resolve => {
            let intervalId = null;
            let timeoutId = null;
            let resolved = false;

            const cleanup = () => {
              if (resolved) {
                return;
              }

              resolved = true;

              if (intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
              }

              if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }

              cleanupTimers = null;
              resolve();
            };

            cleanupTimers = cleanup;

            intervalId = setInterval(() => {
              if (socket.socket.readyState === WebSocket.CLOSED) {
                cleanup();
              }
            }, 10);

            timeoutId = setTimeout(() => {
              cleanup();
            }, 1000);
          });
        }
      } catch (e) {
        if (e?.name !== 'TwoFasError' || e?.code !== 9040) {
          CatchError(e);
        }
      }
    };

    return () => {
      if (cleanupTimers) {
        cleanupTimers();
      }

      if (closeConnectionRef.current) {
        closeConnectionRef.current().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, []);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    eventBus.on(eventBus.EVENTS.CONNECT.CHANGE_VIEW, setConnectView);
    eventBus.on(eventBus.EVENTS.CONNECT.LOADER, setConnectingLoader);
    eventBus.on(eventBus.EVENTS.CONNECT.SOCKET_ERROR, handleSocketError);
    eventBus.on(eventBus.EVENTS.CONNECT.SHOW_TOAST, showConnectToast);
    eventBus.on(eventBus.EVENTS.CONNECT.DEVICE_NAME, setDeviceName);
    eventBus.on(eventBus.EVENTS.CONNECT.LOGIN, login);

    initEphemeralKeys()
      .then(() => getReadyDevices())
      .then(devices => {
        if (devices.length === 0) {
          setConnectView(CONNECT_VIEWS.QrView);
        } else {
          setConnectView(CONNECT_VIEWS.DeviceSelect);
        }
      })
      .catch(error => {
        CatchError(error);
      });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      eventBus.off(eventBus.EVENTS.CONNECT.CHANGE_VIEW, setConnectView);
      eventBus.off(eventBus.EVENTS.CONNECT.LOADER, setConnectingLoader);
      eventBus.off(eventBus.EVENTS.CONNECT.SOCKET_ERROR, handleSocketError);
      eventBus.off(eventBus.EVENTS.CONNECT.SHOW_TOAST, showConnectToast);
      eventBus.off(eventBus.EVENTS.CONNECT.DEVICE_NAME, setDeviceName);
      eventBus.off(eventBus.EVENTS.CONNECT.LOGIN, login);

      if (closeConnectionRef.current) {
        closeConnectionRef.current().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, []);

  useEffect(() => {
    if (data?.connectSliderIndex === undefined) {
      setData('connectSliderIndex', 0);
    }

    document.addEventListener('keydown', handleKeyboardEnterClick);

    return () => {
      document.removeEventListener('keydown', handleKeyboardEnterClick);
    };
  }, [handleKeyboardEnterClick]);

  useEffect(() => {
    handleViewSwitch();
  }, [connectView, handleViewSwitch]);

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
  }, [readyDevices, sliderMounted]);

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div>
          {/* QR View */}
          <m.section
            className={S.connect}
            variants={viewVariants}
            initial="hidden"
            transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
            animate={connectView === CONNECT_VIEWS.QrView ? 'visible' : 'hidden'}
          >
            <div className={S.connectContainer}>
              <h1>{browser.i18n.getMessage('connect_header')}</h1>

              {readyDevices.length > 0 && (
                <NavigationButton
                  type='cancel'
                  onClick={() => { setConnectView(CONNECT_VIEWS.DeviceSelect); }}
                />
              )}

              <div className={`${S.connectContainerQr} ${socketError ? S.error : ''}`}>
                <div className={S.connectContainerQrErrorContent}>
                  <button className={`${bS.btn} ${bS.btnTheme} ${bS.btnQrReload}`} onClick={handleSocketReload}>{browser.i18n.getMessage('reload')}</button>
                </div>

                <QR qrCode={qrCode} />
              </div>

              <div className={S.connectDescription}>
                <InfoIcon />
                <p>{browser.i18n.getMessage('connect_description')}</p>
              </div>
            </div>
          </m.section>

          {/* Device Select */}
          <m.section
            className={S.deviceSelect}
            variants={viewVariants}
            initial="hidden"
            transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
            animate={connectView === CONNECT_VIEWS.DeviceSelect ? 'visible' : 'hidden'}
          >
            <div className={S.deviceSelectContainer}>
              <h1>{browser.i18n.getMessage('connect_device_select_header')}</h1>
              <h2>{browser.i18n.getMessage('connect_device_select_list_header')}</h2>

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
                            onClick={() => connectByPush(device, abortControllerRef.current?.signal)}
                          >
                            {generateDeviceIcon(device)}
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
                
                {generatePagination()}
              </div>

              <div className={S.deviceSelectContainerAdd}>
                <button
                  className={`${bS.btn} ${bS.btnClear}`}
                  onClick={() => { setConnectView(CONNECT_VIEWS.QrView); }}
                >
                  <span>{browser.i18n.getMessage('connect_device_select_add_another')}</span>
                  <DeviceQrIcon />
                </button>
              </div>
            </div>
          </m.section>

          {/* Progress */}
          <m.section
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

                <span>{browser.i18n.getMessage('connect_connecting')}</span>
              </div>

              <div className={S.progressDescription}>
                <p>{browser.i18n.getMessage('connect_connection_opened')}</p>
              </div>

              <div className={`${S.progressDeviceName} ${deviceName ? S.visible : ''}`}>
                <span>{deviceName}</span>
              </div>
            </div>
          </m.section>

          {/* Push Sent */}
          <m.section
            className={S.push}
            variants={viewVariants}
            initial="hidden"
            transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
            animate={connectView === CONNECT_VIEWS.PushSent ? 'visible' : 'hidden'}
          >
            <div className={S.pushContainer}>
              <NavigationButton
                type='cancel'
                onClick={() => { setConnectView(CONNECT_VIEWS.DeviceSelect); }}
              />

              <PushNotification description={browser.i18n.getMessage('connect_push_animation_description')} />

              <div className={`${S.pushDeviceName} ${deviceName ? S.visible : ''}`}>
                <span>{deviceName}</span>
              </div>

              <div className={S.pushAdditional}>
                <div className={`${S.pushAdditionalTrouble} ${bS.btn} ${bS.btnClear}`}>
                  <span>{browser.i18n.getMessage('connect_push_trouble')}</span>

                  <div className={S.pushAdditionalTooltip}>
                    <span>{browser.i18n.getMessage('connect_push_trouble_tooltip')}</span>
                    <span>{browser.i18n.getMessage('connect_push_trouble_tooltip_or')}</span>
                    <button
                      className={`${bS.btn} ${bS.btnClear}`}
                      onClick={async () => { setConnectView(CONNECT_VIEWS.QrView); }}
                    >
                      <span>{browser.i18n.getMessage('connect_push_trouble_tooltip_use_qr')}</span>
                      <DeviceQrIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </m.section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default memo(Connect);
