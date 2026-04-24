// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useParams, Navigate } from 'react-router';

/**
* Function to handle the FetchExternal component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function FetchExternal () {
  let action, from, data, originalData, model, deviceId;

  try {
    const routeParams = useParams();

    if (routeParams && routeParams.data) {
      let decodedData;

      try {
        decodedData = decodeURIComponent(routeParams.data);
      } catch {
        decodedData = routeParams.data;
      }

      const parsed = JSON.parse(decodedData);

      action = parsed.action;
      from = parsed.from;
      data = parsed.data;
      originalData = parsed.originalData;
      model = parsed.model;
      deviceId = parsed.deviceId;
    }
  } catch (e) {
    CatchError(e);
  }

  return (
    <Navigate
      to='/fetch'
      state={{
        action,
        from,
        data,
        originalData,
        model,
        deviceId
      }}
    />
  );
}

export default FetchExternal;
