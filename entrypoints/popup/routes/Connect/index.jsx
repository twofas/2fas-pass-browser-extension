// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Connect.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useEffect, lazy } from 'react';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
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

/** 
* Function component that renders the Connect page.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered Connect component.
*/
function Connect (props) {
  const [qrCode, setQrCode] = useState(null);
  const [socketConnecting, setSocketConnecting] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [headerText, setHeaderText] = useState(browser.i18n.getMessage('connect_header'));
  const [connectingLoader, setConnectingLoader] = useState(264);

  const { login } = useAuth();

  const initConnection = async () => {
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
        setHeaderText(browser.i18n.getMessage('error_general'));
        setSocketConnecting(false);
        setConnectingLoader(264);
      });

      return;
    }

    // Try to create socket up to 5 times with 200ms delay
    let socketCreated = false;

    for (let i = 0; i < 5; i++) {
      try {
        socket = new TwoFasWebSocket(sessionID);
        socketCreated = true;
        break;
      } catch {
        if (i < 4) {
          await new Promise(res => setTimeout(res, 250));
        }
      }
    }

    if (!socketCreated) {
      setSocketError(true);
      setHeaderText(browser.i18n.getMessage('error_general'));
      setSocketConnecting(false);
      setConnectingLoader(264);
      return;
    }

    socket.open();
    socket.addEventListener('message', ConnectOnMessage, { uuid: ephemeralData.uuid }, {});
    socket.addEventListener('close', ConnectOnClose, {}, {});

    setQrCode(qr);
  };

  const handleSocketReload = async () => {
    await initConnection();
    setSocketError(false);
    setHeaderText(browser.i18n.getMessage('connect_header'));
  };

  useEffect(() => {
    // FUTURE - add value validation
    eventBus.on(eventBus.EVENTS.CONNECT.CONNECTING, setSocketConnecting);
    eventBus.on(eventBus.EVENTS.CONNECT.LOADER, setConnectingLoader);
    eventBus.on(eventBus.EVENTS.CONNECT.SOCKET_ERROR, setSocketError);
    eventBus.on(eventBus.EVENTS.CONNECT.HEADER_TEXT, setHeaderText);
    eventBus.on(eventBus.EVENTS.CONNECT.LOGIN, login);

    initConnection();

    return () => {
      eventBus.off(eventBus.EVENTS.CONNECT.CONNECTING, setSocketConnecting);
      eventBus.off(eventBus.EVENTS.CONNECT.LOADER, setConnectingLoader);
      eventBus.off(eventBus.EVENTS.CONNECT.SOCKET_ERROR, setSocketError);
      eventBus.off(eventBus.EVENTS.CONNECT.HEADER_TEXT, setHeaderText);
      eventBus.off(eventBus.EVENTS.CONNECT.LOGIN, login);
    };
  }, []);

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
            
                <span>{browser.i18n.getMessage('connect_connecting')}</span>
              </div>

              <div className={S.progressDescription}>
                <p>{browser.i18n.getMessage('connect_connection_opened')}</p>
              </div>
            </div>
          </m.section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default Connect;
