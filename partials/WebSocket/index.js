// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* WebSocket class for handling TwoFas WebSocket connections.
* @module TwoFasWebSocket
*/
class TwoFasWebSocket {
  static exists = false;
  static instance = null;

  #openListener = null;
  #errorListener = null;

  constructor (sessionId) {
    if (TwoFasWebSocket.exists) {
      throw new TwoFasError(TwoFasError.internalErrors.websocketInstanceExists, { additional: { func: 'TwoFasWebSocket - constructor'} });
    }

    this.socketURL = `wss://${import.meta.env.VITE_WSS_URL_ORIGIN}/proxy/browser_extension/${sessionId}`;

    TwoFasWebSocket.exists = true;
    TwoFasWebSocket.instance = this;

    return this;
  };

  static getInstance () {
    if (!TwoFasWebSocket.exists) {
      throw new TwoFasError(TwoFasError.internalErrors.websocketInstanceNotExists, { additional: { func: 'TwoFasWebSocket - getInstance' } });
    }

    return TwoFasWebSocket.instance;
  };

  #clearTimeout () {
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  };

  #clearInstance () {
    TwoFasWebSocket.exists = false;
    TwoFasWebSocket.instance = null;
  };

  #onOpen (callbackOnOpen = null) {
    this.timeoutID = setTimeout(() => this.close(true), 1000 * 60 * config.webSocketInternalTimeout);

    if (callbackOnOpen && typeof callbackOnOpen === 'function') {
      callbackOnOpen();
    }
  };

  #onError (event) {
    this.#clearTimeout();
    this.#clearInstance();

    throw new TwoFasError(TwoFasError.internalErrors.websocketError, { event, additional: { func: 'TwoFasWebSocket - onError' } });
  };

  #isEventTrusted (event) {
    if (!event.isTrusted || event.type !== 'message' || event.origin !== `wss://${import.meta.env.VITE_WSS_URL_ORIGIN}`) {
      return false;
    }
  
    return true;
  };

  open (callbackOnOpen = null) {
    this.#openListener = () => this.#onOpen(callbackOnOpen);
    this.#errorListener = event => this.#onError(event);

    this.socket = new WebSocket(this.socketURL, '2FAS-Pass');
    this.socket.addEventListener('open', this.#openListener);
    this.socket.addEventListener('error', this.#errorListener);
  };

  addEventListener (event, callback, data = {}, actions = {}) {
    if (event === 'message') {
      this.socket.addEventListener('message', e => {
        if (!this.#isEventTrusted(e)) {
          throw new TwoFasError(TwoFasError.internalErrors.websocketEventNotTrusted, { additional: { func: 'TwoFasWebSocket - addEventListener message' } });
        }

        // @TODO: Add scheme check

        this.#clearTimeout();

        let json;

        try {
          json = JSON.parse(e.data);
        } catch (error) {
          throw new TwoFasError(TwoFasError.internalErrors.websocketMessageFailToParse, { event: error, additional: { func: 'TwoFasWebSocket - addEventListener message' } });
        }

        return callback(json, data, actions);
      });
    } else if (event === 'close') {
      this.socket.addEventListener('close', e => {
        this.#clearTimeout();
        this.#clearInstance();
        return callback(e, data, actions);
      });
    } else {
      this.socket.addEventListener(event, e => {
        this.#clearTimeout();
        return callback(e, data, actions);
      });  
    }
  };

  close (timeout = false) {
    this.socket.removeEventListener('open', this.#openListener);
    this.socket.removeEventListener('error', this.#errorListener);

    if (timeout) {
      this.socket.close(WEBSOCKET_STATES.CONNECTION_TIMEOUT, 'Timeout');
    }
    
    if (this.socket.readyState !== WebSocket.CLOSED) {
      try {
        this.socket.close();
      } catch {}
    }
    
    this.#clearTimeout();
    this.#clearInstance();
  };

  sendMessage = async data => {
    if (this.socket.readyState === WebSocket.OPEN) {
      const { scheme, origin, originVersion } = await getBeInfo();

      this.socket.send(JSON.stringify({
        scheme,
        origin,
        originVersion,
        ...data
      }));
    } else {
      throw new TwoFasError(TwoFasError.internalErrors.websocketNotOpened, { additional: { func: 'TwoFasWebSocket - sendMessage' } });
    }
  };

  sendError = async data => {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const manifest = browser.runtime.getManifest();
    const browserInfo = await storage.getItem('local:browserInfo');

    this.socket.send(JSON.stringify({
      scheme: config.scheme,
      origin: `browserExt-${browserInfo?.browserName?.toLowerCase()}`,
      originVersion: manifest.version,
      id: data.id || '',
      action: SOCKET_ACTIONS.CLOSE_WITH_ERROR,
      payload: {
        errorCode: data.errorCode || data.code || '2000',
        errorMessage: data.errorMessage || data.message || 'Unknown error'
      }
    }));
    
    if (this.socket.readyState !== WebSocket.CLOSED) {
      try {
        this.socket.close(WEBSOCKET_STATES.INTERNAL_ERROR, 'Internal error');
      } catch {}
    }

    this.#clearTimeout();
    this.#clearInstance();
  };
}

export default TwoFasWebSocket;
