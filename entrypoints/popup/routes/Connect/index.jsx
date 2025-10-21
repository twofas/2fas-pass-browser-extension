// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Connect.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useAuthActions } from '@/hooks/useAuth';
import { generateSessionKeysNonces, generateEphemeralKeys, generateSessionID, calculateSignature, generateQR } from './functions';
import ConnectOnMessage from './socket/ConnectOnMessage';
import ConnectOnClose from './socket/ConnectOnClose';
import TwoFasWebSocket from '@/partials/WebSocket';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import DeviceQrIcon from '@/assets/popup-window/device-qr.svg?react';
import QR from './components/QR';
import NavigationButton from '../../components/NavigationButton';
import { getNTPTime, sendPush } from '@/partials/functions';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

const viewVariants = {
  visible: { opacity: 1, borderWidth: '1px', pointerEvents: 'auto' },
  hidden: { opacity: 0, borderWidth: '0px', pointerEvents: 'none' }
};

const i18nKeys = {
  connectHeader: 'connect_header',
  errorGeneral: 'error_general',
  reload: 'reload',
  connecting: 'connect_connecting',
  connectionOpened: 'connect_connection_opened',
  connectDescription: 'connect_description'
};

/** 
* Function component that renders the Connect page.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered Connect component.
*/
function Connect (props) {
  const [qrCode, setQrCode] = useState(null);
  const [socketConnecting, setSocketConnecting] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [connectingLoader, setConnectingLoader] = useState(264);
  const [deviceName, setDeviceName] = useState(null);
  const [readyDevices, setReadyDevices] = useState([]);
  const [qrView, setQrView] = useState(null);

  const { login } = useAuthActions();
  const closeConnectionRef = useRef(null);
  const ephemeralDataRef = useRef(null);

  const i18n = useMemo(() => ({
    connectHeader: browser.i18n.getMessage(i18nKeys.connectHeader),
    errorGeneral: browser.i18n.getMessage(i18nKeys.errorGeneral),
    reload: browser.i18n.getMessage(i18nKeys.reload),
    connecting: browser.i18n.getMessage(i18nKeys.connecting),
    connectionOpened: browser.i18n.getMessage(i18nKeys.connectionOpened),
    connectDescription: browser.i18n.getMessage(i18nKeys.connectDescription)
  }), []);

  const [headerText, setHeaderText] = useState(null);

  const getReadyDevices = useCallback(async () => {
    const devices = await storage.getItem('local:devices') || [];
    const filteredDevices = devices.filter(device => {
      return device.scheme && device.scheme >= config.schemeThreshold &&
             device.platform && device.fcmToken && device.sessionId;
    });

    return filteredDevices;
  }, []);

  const initConnection = useCallback(async () => {
    await generateSessionKeysNonces();
    ephemeralDataRef.current = await generateEphemeralKeys();
  }, []);

  const initQRConnection = useCallback(async () => {
    let sessionID, signature, qr, socket;

    console.log(ephemeralDataRef);

    try {
      sessionID = await generateSessionID();
      signature = await calculateSignature(ephemeralDataRef.current.publicKey, sessionID);
      setHeaderText(i18n.connectHeader);
      qr = await generateQR(ephemeralDataRef.current.publicKey, sessionID, signature);
    } catch (e) {
      console.error('Error during connection init:', e);

      await CatchError(e, () => {
        setSocketError(true);
        setHeaderText(i18n.errorGeneral);
        setSocketConnecting(false);
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

        await new Promise(res => setTimeout(res, 250));
      }
    }

    if (!socketCreated) {
      setSocketError(true);
      setHeaderText(i18n.errorGeneral);
      setSocketConnecting(false);
      setConnectingLoader(264);
      return;
    }

    socket.open();
    socket.addEventListener('message', ConnectOnMessage, { uuid: ephemeralDataRef.current.uuid });
    socket.addEventListener('close', ConnectOnClose);

    setQrCode(qr);
  }, [i18n.errorGeneral]);

  const handleSocketReload = useCallback(async () => {
    await initConnection();
    await initQRConnection();
    setSocketError(false);
    setHeaderText(i18n.connectHeader);
  }, [initConnection, initQRConnection, i18n.connectHeader]);

  const connectByPush = async device => {
    console.log('connect by push', device);

    // add UUID from ephemeral data to device object
    device.uuid = ephemeralDataRef.current.uuid;

    let sessionId, timestamp, sigPush;

    try {
      sessionId = Base64ToHex(device?.sessionId).toLowerCase();
      console.log('Device Session ID HEX: ', sessionId);

      const timestampValue = await getNTPTime();
      timestamp = timestampValue.toString();

      console.log('NTP Time:', timestamp);

      sigPush = await calculateSignature(sessionId, device?.id, device?.uuid, timestamp);
      console.log('Signature for push:', sigPush);
    } catch (e) {
      console.error(e);
    }

    try {
      const json = await sendPush(device, { timestamp, sigPush, messageType: 'be_request' });

      console.log('Push response', json);

      if (json?.error === 'UNREGISTERED') {
        setSocketError(true);
        setHeaderText(browser.i18n.getMessage('fetch_token_unregistered_header'));
        return false;
      }

      const socket = new TwoFasWebSocket(sessionId);
      socket.open();
      socket.addEventListener('message', ConnectOnMessage, { uuid: device.uuid });
      socket.addEventListener('close', ConnectOnClose);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    closeConnectionRef.current = () => {
      try {
        const socket = TwoFasWebSocket.getInstance();

        if (socket) {
          socket.close(WEBSOCKET_STATES.NORMAL_CLOSURE, 'Component unmounted');
        }
      } catch (e) {
        if (e?.name !== 'TwoFasError' || e?.code !== 9040) {
          CatchError(e);
        }
      }
    };

    return () => {
      if (closeConnectionRef.current) {
        closeConnectionRef.current();
      }
    };
  }, []);

  useEffect(() => {
    eventBus.on(eventBus.EVENTS.CONNECT.CONNECTING, setSocketConnecting);
    eventBus.on(eventBus.EVENTS.CONNECT.LOADER, setConnectingLoader);
    eventBus.on(eventBus.EVENTS.CONNECT.SOCKET_ERROR, setSocketError);
    eventBus.on(eventBus.EVENTS.CONNECT.HEADER_TEXT, setHeaderText);
    eventBus.on(eventBus.EVENTS.CONNECT.DEVICE_NAME, setDeviceName);
    eventBus.on(eventBus.EVENTS.CONNECT.LOGIN, login);

    initConnection()
      .then(getReadyDevices)
      .then(devices => {
        console.log('Ready devices:', devices);

        setReadyDevices(devices);

        if (devices.length === 0) {
          setQrView(true);
          initQRConnection();
        } else {
          setQrView(false);
          setHeaderText('Securely access your vault in the 2FAS Pass mobile app');
        }
      })
      .catch(e => {
        console.error('Error!', e);
      });

    return () => {
      eventBus.off(eventBus.EVENTS.CONNECT.CONNECTING, setSocketConnecting);
      eventBus.off(eventBus.EVENTS.CONNECT.LOADER, setConnectingLoader);
      eventBus.off(eventBus.EVENTS.CONNECT.SOCKET_ERROR, setSocketError);
      eventBus.off(eventBus.EVENTS.CONNECT.HEADER_TEXT, setHeaderText);
      eventBus.off(eventBus.EVENTS.CONNECT.DEVICE_NAME, setDeviceName);
      eventBus.off(eventBus.EVENTS.CONNECT.LOGIN, login);

      if (closeConnectionRef.current) {
        closeConnectionRef.current();
      }
    };
  }, [initConnection, initQRConnection, getReadyDevices, login]);

  useEffect(() => {
    if (qrView) {
      initConnection();
    } else {
      closeConnectionRef.current();
    }
  }, [qrView]);

  if (qrView === null) {
    return null;
  }

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div>
          <m.section
            className={S.connect}
            variants={viewVariants}
            initial="hidden"
            transition={{ duration: 0.3, type: 'tween' }}
            animate={(!qrView || socketConnecting) ? 'hidden' : 'visible'}
          >
            <div className={S.connectContainer}>
              <h1>{headerText}</h1>

              {readyDevices.length > 0 && (
                <NavigationButton
                  type='cancel'
                  onClick={() => { setQrView(false); }}
                />
              )}

              <div className={`${S.connectContainerQr} ${socketError ? S.error : ''}`}>
                <div className={S.connectContainerQrErrorContent}>
                  <button className={`${bS.btn} ${bS.btnTheme} ${bS.btnQrReload}`} onClick={handleSocketReload}>{i18n.reload}</button>
                </div>

                <QR qrCode={qrCode} />
              </div>

              <div className={S.connectDescription}>
                <InfoIcon />
                <p>{i18n.connectDescription}</p>
              </div>
            </div>
          </m.section>
          <m.section
            className={S.deviceSelect}
            variants={viewVariants}
            initial="hidden"
            transition={{ duration: 0.3, type: 'tween' }}
            animate={(!qrView && !socketConnecting) ? 'visible' : 'hidden'}
          >
            <div className={S.deviceSelectContainer}>
              <h1>{headerText}</h1>

              <div className={S.deviceSelectContainerList}>
                <div className={S.deviceSelectContainerListDevices}>
                  <p>Select device:</p>

                  <div className={S.deviceSelectContainerListDevicesButtons}>
                    {readyDevices.map((device, index) => (
                      <button
                        key={index}
                        className={S.deviceSelectContainerListItem}
                        title={device.name}
                        onClick={() => connectByPush(device)}
                      >
                        <span>{device.name || 'Unnamed device'}</span>
                      </button>
                    ))}
                  </div>
                </div>                
              </div>

              <div className={S.deviceSelectContainerAdd}>
                <button
                  className={`${bS.btn} ${bS.btnClear}`}
                  onClick={() => {
                    setQrView(true);
                    initQRConnection();
                  }}
                >
                  <span>Add another device</span>
                  <DeviceQrIcon />
                </button>
              </div>
            </div>
          </m.section>
          <m.section
            className={S.progress}
            variants={viewVariants}
            initial="hidden"
            transition={{ duration: 0.3, type: 'tween' }}
            animate={socketConnecting ? 'visible' : 'hidden'}
          >
            <div className={S.progressContainer}>
              <div className={S.progressLoader}>
                <svg className={`${S.progressLoaderCircle}`} style={{ strokeDashoffset: connectingLoader }} viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="48" cy="48" r="42" className={S.progressLoaderCircleBg} />
                  <circle cx="48" cy="48" r="42" />
                </svg>

                <span>{i18n.connecting}</span>
              </div>

              <div className={S.progressDescription}>
                <p>{i18n.connectionOpened}</p>
              </div>

              <div className={`${S.progressDeviceName} ${deviceName ? S.visible : ''}`}>
                <span>{deviceName}</span>
              </div>
            </div>
          </m.section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default memo(Connect);
