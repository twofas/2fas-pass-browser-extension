// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* This function is used to catch errors and log them to the API and/or console. It also allows for a callback function to be executed after the error is caught.
* @async
* @param {Error|SyntaxError|ReferenceError|TypeError|DataError|TwoFasError|Event} errObj - The error object to catch.
* @param {Function} callback - The callback function to execute after the error is caught.
* @return {void} No return value.
*/
const CatchError = async (errObj, callback = () => {}) => {
  const manifest = browser.runtime.getManifest();
  const browserInfo = await storage.getItem('local:browserInfo');
  const storageLogging = await storage.getItem('local:logging');

  const logObj = {
    streams: [
      {
        stream: {
          app: '2fas-pass-browser-extension',
          platform: 'browser',
          scheme: config?.scheme || 'UnknownScheme',
          origin: `browserExt-${browserInfo?.browserName?.toLowerCase()}` || 'UnknownOrigin',
          originVersion: manifest?.version || 'UnknownVersion',
          browserName: browserInfo?.browserName || 'UnknownBrowserName',
          browserVersion: browserInfo?.browserVersion || 'UnknownBrowserVersion'
        },
        values: []
      }
    ],
  };

  const valueObj = {};

  switch (true) {
    case errObj instanceof Event: {
      valueObj.name = 'EventError';
      valueObj.currentTargetURL = errObj?.currentTarget?.url || '';
      valueObj.path = errObj?.path || [];
      valueObj.type = errObj?.type || '';
      valueObj.stringify = JSON.stringify(errObj);

      break;
    }

    case errObj instanceof Error:
    case errObj instanceof SyntaxError:
    case errObj instanceof ReferenceError:
    case errObj instanceof TypeError: {
      valueObj.name = errObj?.name || 'Error';
      valueObj.message = errObj?.message || '';
      valueObj.stack = JSON.stringify(errObj?.stack) || errObj?.stack || '';
      valueObj.toString = errObj?.toString() || '';
      valueObj.cause = errObj?.cause || '';
      valueObj.code = errObj?.code || '';
      valueObj.stringify = JSON.stringify(errObj);

      break;
    }

    case errObj instanceof TwoFasError: {
      valueObj.name = errObj?.name || 'TwoFasError';
      valueObj.message = errObj?.message || '';
      valueObj.stack = JSON.stringify(errObj?.stack) || errObj?.stack || '';
      valueObj.timestamp = errObj?.timestamp || '';
      valueObj.code = errObj?.code || '';
      valueObj.apiLog = errObj?.apiLog || true;
      valueObj.consoleLog = errObj?.consoleLog || true;
      valueObj.event = errObj?.event?.toString() || null;
      valueObj.additional = errObj?.additional || {};
      valueObj.stringify = JSON.stringify(errObj);

      break;
    }

    default: {
      valueObj.name = errObj?.name || 'UnknownError';
      valueObj.message = errObj?.message || '';
      valueObj.stack = JSON.stringify(errObj?.stack) || errObj?.stack || '';
      valueObj.toString = errObj?.toString() || '';
      valueObj.cause = errObj?.cause || '';
      valueObj.code = errObj?.code || '';
      valueObj.stringify = JSON.stringify(errObj);
      valueObj.additional = errObj?.additional || {};

      break;
    }
  }

  if (errObj instanceof TwoFasError) {
    if (errObj.consoleLog) {
      console.error(errObj.event || errObj);
      console.trace(errObj);
    }
  } else {
    console.trace(errObj);
  }

  logObj.streams[0].values.push([(Date.now() * 1000000).toString(), JSON.stringify(valueObj)]);

  if ((errObj instanceof TwoFasError && errObj.apiLog && storageLogging) || storageLogging || import.meta.env.DEV) {
    try {
      await fetch(import.meta.env.VITE_API_LOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${import.meta.env.VITE_API_LOG_TOKEN}`
        },
        body: JSON.stringify(logObj)
      });  
    } catch {}
  }

  if (typeof callback === 'function') {
    try {
      callback(errObj);
    } catch {}
  }

  return errObj;
};

export default CatchError;
