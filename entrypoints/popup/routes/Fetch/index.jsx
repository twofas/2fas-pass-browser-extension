// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Fetch.module.scss';
import { useLocation, useNavigate } from 'react-router';
import { useEffect, useRef, useCallback, lazy } from 'react';
import { FETCH_STATE } from './constants';
import { PULL_REQUEST_TYPES } from '@/constants';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import { useI18n } from '@/partials/context/I18nContext';

const PushNotification = lazy(() => import('./components/PushNotification'));
const ConnectionError = lazy(() => import('./components/ConnectionError'));
const ConnectionTimeout = lazy(() => import('./components/ConnectionTimeout'));
const ContinueUpdate = lazy(() => import('./components/ContinueUpdate'));

function Fetch (props) {
  const { getMessage } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { wsState: bgState, sendCommand } = useBackgroundWS();
  const { state } = location;
  const initDoneRef = useRef(false);

  const fetchState = bgState?.fetchState ?? (state?.action === PULL_REQUEST_TYPES.UPDATE_DATA ? FETCH_STATE.CONTINUE_UPDATE : FETCH_STATE.PUSH_NOTIFICATION);
  const errorText = bgState?.fetchErrorText || getMessage('fetch_connection_error_header');
  const currentAction = bgState?.fetchAction || state?.action;

  const getPushNotificationDescription = useCallback(action => {
    switch (action) {
      case PULL_REQUEST_TYPES.SIF_REQUEST: {
        return getMessage('fetch_sif_request_description');
      }

      case PULL_REQUEST_TYPES.DELETE_DATA: {
        return getMessage('fetch_delete_request_description');
      }

      case PULL_REQUEST_TYPES.FULL_SYNC: {
        return getMessage('fetch_full_sync_description');
      }

      case PULL_REQUEST_TYPES.ADD_DATA: {
        return getMessage('fetch_add_request_description');
      }

      default: {
        return undefined;
      }
    }
  }, [getMessage]);

  const tryAgainHandle = useCallback(async () => {
    await sendCommand(REQUEST_ACTIONS.WS_CANCEL);

    await sendCommand(REQUEST_ACTIONS.WS_FETCH, {
      fetchAction: state?.action,
      fetchData: state?.data,
      from: state?.from
    });
  }, [sendCommand, state?.action, state?.data, state?.from]);

  const cancelHandle = useCallback(async e => {
    e.preventDefault();
    await sendCommand(REQUEST_ACTIONS.WS_CANCEL);

    if (state?.from === 'contextMenu' || state?.from === 'shortcut' || state?.from === 'savePrompt') {
      navigate('/');
    } else if (state?.from === 'add-new' && state?.originalData && state?.model) {
      navigate(`/add-new/${state.model}`, {
        state: {
          data: state.originalData,
          from: 'fetch'
        }
      });
    } else if (state?.from === 'details' && state?.data) {
      navigate(`/details/${state.data.deviceId}/${state.data.vaultId}/${state.data.itemId}`, {
        state: { from: 'fetch' }
      });
    } else {
      if (fetchState === FETCH_STATE.CONNECTION_ERROR) {
        navigate('/');
      } else {
        navigate(-1);
      }
    }
  }, [sendCommand, state, fetchState, navigate]);

  // Initialize fetch
  useEffect(() => {
    if (initDoneRef.current) {
      return;
    }

    initDoneRef.current = true;

    if (bgState?.active && bgState?.type === 'fetch') {
      return;
    }

    if (!state?.action) {
      navigate('/', { replace: true });
      return;
    }

    sendCommand(REQUEST_ACTIONS.WS_FETCH, {
      fetchAction: state.action,
      fetchData: state.data,
      from: state.from
    });
  }, [bgState?.active, bgState?.type, state, sendCommand, navigate]);

  // Cleanup: cancel WS on unmount
  useEffect(() => {
    return () => {
      sendCommand(REQUEST_ACTIONS.WS_CANCEL).catch(() => {});
    };
  }, [sendCommand]);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.fetch}>
          <div className={S.fetchContainer}>
            <NavigationButton type='cancel' onClick={cancelHandle} />

            {fetchState === FETCH_STATE.PUSH_NOTIFICATION && <PushNotification fetchState={fetchState} description={getPushNotificationDescription(currentAction)} />}
            {fetchState === FETCH_STATE.CONNECTION_ERROR && <ConnectionError fetchState={fetchState} errorText={errorText} />}
            {fetchState === FETCH_STATE.CONNECTION_TIMEOUT && <ConnectionTimeout fetchState={fetchState} tryAgainHandle={tryAgainHandle} />}
            {fetchState === FETCH_STATE.CONTINUE_UPDATE && <ContinueUpdate fetchState={fetchState} />}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Fetch;
