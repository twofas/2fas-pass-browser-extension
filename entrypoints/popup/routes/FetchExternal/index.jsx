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
  let params, action, from;

  try {
    params = useParams();

    if (params && params.data) {
      let decodedData;

      try {
        decodedData = decodeURIComponent(params.data);
      } catch {
        decodedData = params.data;
      }

      params = JSON.parse(decodedData);

      action = params.action;
      from = params.from;

      delete params.action;
      delete params.from;
    }
  } catch (e) {
    CatchError(e);
  }

  return (
    <Navigate
      to='/fetch'
      state={{
        action: action,
        from: from,
        ...params
      }}
    />
  );
}

export default FetchExternal;
