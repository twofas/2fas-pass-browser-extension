// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Connect.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useEffect, useCallback, useMemo, useRef, lazy, memo } from 'react';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useAuthActions } from '@/hooks/useAuth';
import { generateSessionKeysNonces, generateEphemeralKeys, generateSessionID, calculateSignature, generateQR } from './functions';
import ConnectOnMessage from './socket/ConnectOnMessage';
import ConnectOnClose from './socket/ConnectOnClose';
import TwoFasWebSocket from '@/partials/WebSocket';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const InfoIcon = lazy(() => import('@/assets/popup-window/info.svg?react'));
const QR = lazy(() => import('./components/QR'));

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

  const { login } = useAuthActions();
  const closeConnectionRef = useRef(null);

  const i18n = useMemo(() => ({
    connectHeader: browser.i18n.getMessage(i18nKeys.connectHeader),
    errorGeneral: browser.i18n.getMessage(i18nKeys.errorGeneral),
    reload: browser.i18n.getMessage(i18nKeys.reload),
    connecting: browser.i18n.getMessage(i18nKeys.connecting),
    connectionOpened: browser.i18n.getMessage(i18nKeys.connectionOpened),
    connectDescription: browser.i18n.getMessage(i18nKeys.connectDescription)
  }), []);

  const [headerText, setHeaderText] = useState(i18n.connectHeader);

  const initConnection = useCallback(async () => {
    let sessionID, signature, qr, ephemeralData, socket;

    try {
      await generateSessionKeysNonces();
      ephemeralData = await generateEphemeralKeys();
      sessionID = await generateSessionID();
      signature = await calculateSignature(ephemeralData.publicKey, sessionID);
      qr = await generateQR(ephemeralData.publicKey, sessionID, signature);
    } catch (e) {
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
    socket.addEventListener('message', ConnectOnMessage, { uuid: ephemeralData.uuid });
    socket.addEventListener('close', ConnectOnClose);

    setQrCode(qr);
  }, [i18n.errorGeneral]);

  const handleSocketReload = useCallback(async () => {
    await initConnection();
    setSocketError(false);
    setHeaderText(i18n.connectHeader);
  }, [initConnection, i18n.connectHeader]);

  useEffect(() => {
    closeConnectionRef.current = () => {
      try {
        const socket = TwoFasWebSocket.getInstance();

        if (socket) {
          socket.close(1000, 'Component unmounted');
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
    eventBus.on(eventBus.EVENTS.CONNECT.LOGIN, login);

    requestAnimationFrame(() => {
      initConnection();
    });

    return () => {
      eventBus.off(eventBus.EVENTS.CONNECT.CONNECTING, setSocketConnecting);
      eventBus.off(eventBus.EVENTS.CONNECT.LOADER, setConnectingLoader);
      eventBus.off(eventBus.EVENTS.CONNECT.SOCKET_ERROR, setSocketError);
      eventBus.off(eventBus.EVENTS.CONNECT.HEADER_TEXT, setHeaderText);
      eventBus.off(eventBus.EVENTS.CONNECT.LOGIN, login);
    };
  }, [initConnection, login]);

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div>
          <m.section
            className={S.connect}
            variants={viewVariants}
            initial="visible"
            transition={{ duration: 0.3, type: 'tween' }}
            animate={socketConnecting ? 'hidden' : 'visible'}
          >
            <div className={S.connectContainer}>
              <h1>{headerText}</h1>

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
            </div>
          </m.section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default memo(Connect);
