// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Fetch.module.scss';
import { useLocation, useNavigate } from 'react-router';
import { useState, useEffect, lazy } from 'react';
import FetchOnMessage from './socket/FetchOnMessage';
import FetchOnClose from './socket/FetchOnClose';
import TwoFasWebSocket from '@/partials/WebSocket';
import PULL_REQUEST_TYPES from './constants/PULL_REQUEST_TYPES';
import calculateSignature from './functions/calculateSignature';
import { getCurrentDevice, sendPush, getNTPTime, deletePush } from '@/partials/functions';

const PushNotification = lazy(() => import('./components/PushNotification'));
const ConnectionError = lazy(() => import('./components/ConnectionError'));
const ConnectionTimeout = lazy(() => import('./components/ConnectionTimeout'));
const ContinueUpdate = lazy(() => import('./components/ContinueUpdate'));
const NavigationButton = lazy(() => import('@/entrypoints/popup/components/NavigationButton'));

/**
* Function to handle the Fetch component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Fetch (props) {
  const location = useLocation();
  const { state } = location;

  const navigate = useNavigate();
  const { wsActivate, wsDeactivate } = useWS();

  let device;

  const [fetchState, setFetchState] = useState(-1); // 0 - pushNotification, 1 - connectionError, 2 - connectionTimeout, 3 - continueUpdate
  const [errorText, setErrorText] = useState(browser.i18n.getMessage('fetch_connection_error_header'));

  const initConnection = async () => {
    switch (state?.action) {
      case PULL_REQUEST_TYPES.UPDATE_DATA: {
        setFetchState(3);
        break;
      }

      case PULL_REQUEST_TYPES.ADD_DATA:
      case PULL_REQUEST_TYPES.SIF_REQUEST:
      case PULL_REQUEST_TYPES.DELETE_DATA: {
        setFetchState(0);
        break;
      }

      default: {
        setFetchState(1);
        
        throw new TwoFasError(TwoFasError.internalErrors.fetchInvalidAction, {
          additional: {
            data: { stateAction: state.action },
            func: 'Fetch - initConnection'
          }
        });
      }
    }

    let sessionId, timestamp, sigPush;

    try {
      device = await getCurrentDevice(state?.data?.deviceId || null);

      if (!device?.sessionId || !device?.id || !device?.uuid) {
        setFetchState(1);
        setErrorText(browser.i18n.getMessage('error_general'));
        return false;
      }

      sessionId = Base64ToHex(device?.sessionId).toLowerCase();
      const timestampValue = await getNTPTime();
      timestamp = timestampValue.toString();
      sigPush = await calculateSignature(sessionId, device?.id, device?.uuid, timestamp);
    } catch (e) {
      await CatchError(e, () => { setFetchState(1); });
    }
    
    try {
      const json = await sendPush(device, { timestamp, sigPush, messageType: 'be_request' });

      if (json?.error === 'UNREGISTERED') {
        setFetchState(1);
        setErrorText(browser.i18n.getMessage('fetch_token_unregistered_header'));
        return false;
      }

      state.data.notificationId = json.notificationId;
    } catch (e) {
      await CatchError(new TwoFasError(TwoFasError.internalErrors.fetchSendPush, {
        event: e,
        additional: {
          data: { device, timestamp, sigPush },
          func: 'Fetch - initConnection'
        }
      }), () => { setFetchState(1); });
    }

    const socket = new TwoFasWebSocket(sessionId);
    socket.open(() => { wsActivate(); });
    socket.addEventListener('message', FetchOnMessage, { state, device }, { setFetchState, setErrorText, navigate, wsDeactivate });
    socket.addEventListener('close', FetchOnClose, { state }, { setFetchState, setErrorText, wsDeactivate });
  };

  const closeConnection = async () => {
    let socket;

    try {
      await deletePush(device.id, state.data.notificationId);
    } catch {}

    try {
      socket = TwoFasWebSocket.getInstance();
    } catch {}
    
    if (socket) {
      try {
        await socket.sendError(
          new TwoFasError(TwoFasError.errors.userCancelled, {
            apiLog: false,
            consoleLog: false
          })
        );
      } catch {}
    }
  };

  const tryAgainHandle = async () => {
    await initConnection();
  };

  // FUTURE - Refactor (useCallback?)
  const cancelHandle = async e => {
    e.preventDefault();
    await closeConnection();

    if (state?.from === 'contextMenu' || state?.from === 'shortcut' || state?.from === 'savePrompt') {
      if (
        window &&
        typeof window?.close === 'function' &&
        import.meta.env.BROWSER !== 'safari'
      ) {
        window.close();
      } else {
        navigate('/');
      }
    } else {
      if (fetchState === 1) {
        navigate('/');
      } else {
        navigate(-1);
      }
    }
  };

  useEffect(() => {
    initConnection();

    return () => {
      closeConnection();
    };
  }, []);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.fetch}> 
          <div className={S.fetchContainer}>
            <NavigationButton type='cancel' onClick={cancelHandle} />

            {fetchState === 0 && <PushNotification fetchState={fetchState} /> }
            {fetchState === 1 && <ConnectionError fetchState={fetchState} errorText={errorText} /> }
            {fetchState === 2 && <ConnectionTimeout fetchState={fetchState} tryAgainHandle={tryAgainHandle} />}
            {fetchState === 3 && <ContinueUpdate fetchState={fetchState} />}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Fetch;
