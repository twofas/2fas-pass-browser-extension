// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Gets the current NTP time.
* @async
* @return {number} The current NTP time in milliseconds since the epoch.
*/
const getNTPTime = async () => {
  let response;

  try {
    response = await fetch(`https://${import.meta.env.VITE_API_URL_ORIGIN}/time`, { method: 'GET' });
  } catch {
    return new Date().valueOf();
  }
  
  if (!response || !response?.ok) {
    return new Date().valueOf();
  }

  const data = await response.text();

  return parseInt(data, 10);
};

export default getNTPTime;
