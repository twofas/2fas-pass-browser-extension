// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Fetch.module.scss';
import { useLocation, useNavigate } from 'react-router';
import { useState, useEffect, useRef, lazy } from 'react';
import FetchOnMessage from './socket/FetchOnMessage';
import FetchOnClose from './socket/FetchOnClose';
import TwoFasWebSocket from '@/partials/WebSocket';
import { FETCH_STATE } from './constants';
import { PULL_REQUEST_TYPES } from '@/constants';
import calculateFetchSignature from './functions/calculateFetchSignature';
import { getCurrentDevice, sendPush, getNTPTime, deletePush } from '@/partials/functions';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';

const PushNotification = lazy(() => import('./components/PushNotification'));
const ConnectionError = lazy(() => import('./components/ConnectionError'));
const ConnectionTimeout = lazy(() => import('./components/ConnectionTimeout'));
const ContinueUpdate = lazy(() => import('./components/ContinueUpdate'));

/**
* Function to handle the Fetch component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Fetch (props) {
  const location = useLocation();
  const { state } = location;

  const navigate = useNavigate();

  console.log(state);

  let device;

  const [fetchState, setFetchState] = useState(FETCH_STATE.DEFAULT);
  const [errorText, setErrorText] = useState(browser.i18n.getMessage('fetch_connection_error_header'));
  const abortControllerRef = useRef(null);

  const initConnection = async abortSignal => {
    if (abortSignal?.aborted) {
      return false;
    }

    switch (state?.action) {
      case PULL_REQUEST_TYPES.UPDATE_DATA: {
        setFetchState(FETCH_STATE.CONTINUE_UPDATE);
        break;
      }

      case PULL_REQUEST_TYPES.ADD_DATA:
      case PULL_REQUEST_TYPES.SIF_REQUEST:
      case PULL_REQUEST_TYPES.DELETE_DATA:
      case PULL_REQUEST_TYPES.FULL_SYNC: {
        setFetchState(FETCH_STATE.PUSH_NOTIFICATION);
        break;
      }

      default: {
        setFetchState(FETCH_STATE.CONNECTION_ERROR);

        throw new TwoFasError(TwoFasError.internalErrors.fetchInvalidAction, {
          additional: {
            data: { stateAction: state.action },
            func: 'Fetch - initConnection'
          }
        });
      }
    }

    if (abortSignal?.aborted) {
      return false;
    }

    let sessionId, timestamp, sigPush;

    try {
      device = await getCurrentDevice(state?.data?.deviceId || null);

      if (abortSignal?.aborted) {
        return false;
      }

      if (!device?.sessionId || !device?.id || !device?.uuid) {
        setFetchState(FETCH_STATE.CONNECTION_ERROR);
        setErrorText(browser.i18n.getMessage('error_general'));
        return false;
      }

      sessionId = Base64ToHex(device?.sessionId).toLowerCase();
      const timestampValue = await getNTPTime();
      timestamp = timestampValue.toString();
      sigPush = await calculateFetchSignature(sessionId, device?.id, device?.uuid, timestamp);
    } catch (e) {
      await CatchError(e, () => { setFetchState(FETCH_STATE.CONNECTION_ERROR); });
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
        setFetchState(FETCH_STATE.CONNECTION_ERROR);
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
      }), () => { setFetchState(FETCH_STATE.CONNECTION_ERROR); });
    }

    if (abortSignal?.aborted) {
      return false;
    }

    console.log('state', state);
    console.log('device', device);

    const socket = new TwoFasWebSocket(sessionId);
    socket.open();
    socket.addEventListener('message', FetchOnMessage, { state, device });
    socket.addEventListener('close', FetchOnClose, { state });
  };

  const closeConnection = async () => {
    console.log('Close connection called');

    let socket;

    try {
      await deletePush(device.id, state.data.notificationId);
    } catch {}

    try {
      socket = TwoFasWebSocket.getInstance();
    } catch {}

    console.log('Socket instance:', socket);
    
    if (socket) {
      try {
        // await socket.sendError(
        //   new TwoFasError(TwoFasError.errors.userCancelled, {
        //     apiLog: false,
        //     consoleLog: false
        //   })
        // );
        socket.close();
      } catch {}
    }
  };

  const tryAgainHandle = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    await initConnection(abortControllerRef.current.signal);
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

  // FUTURE - Refactor (useCallback?)
  const handleNavigate = ({ path, options = {}}) => {
    return navigate(path, options);
  };

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    // FUTURE - add value validation
    eventBus.on(eventBus.EVENTS.FETCH.SET_FETCH_STATE, setFetchState);
    eventBus.on(eventBus.EVENTS.FETCH.ERROR_TEXT, setErrorText);
    eventBus.on(eventBus.EVENTS.FETCH.NAVIGATE, handleNavigate);
    eventBus.on(eventBus.EVENTS.FETCH.DISCONNECT, closeConnection);

    initConnection(abortControllerRef.current.signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      eventBus.off(eventBus.EVENTS.FETCH.SET_FETCH_STATE, setFetchState);
      eventBus.off(eventBus.EVENTS.FETCH.ERROR_TEXT, setErrorText);
      eventBus.off(eventBus.EVENTS.FETCH.NAVIGATE, handleNavigate);
      eventBus.off(eventBus.EVENTS.FETCH.DISCONNECT, closeConnection);

      closeConnection();
    };
  }, []);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.fetch}> 
          <div className={S.fetchContainer}>
            <NavigationButton type='cancel' onClick={cancelHandle} />

            {fetchState === FETCH_STATE.PUSH_NOTIFICATION && <PushNotification fetchState={fetchState} /> }
            {fetchState === FETCH_STATE.CONNECTION_ERROR && <ConnectionError fetchState={fetchState} errorText={errorText} /> }
            {fetchState === FETCH_STATE.CONNECTION_TIMEOUT && <ConnectionTimeout fetchState={fetchState} tryAgainHandle={tryAgainHandle} />}
            {fetchState === FETCH_STATE.CONTINUE_UPDATE && <ContinueUpdate fetchState={fetchState} />}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Fetch;
