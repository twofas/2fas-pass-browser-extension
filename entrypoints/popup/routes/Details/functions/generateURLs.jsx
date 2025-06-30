// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URL from '../components/URL';

/** 
* Function to generate URLs.
* @param {Object} props - The component props.
* @return {JSX.Element|null} The generated URLs or null if not available.
*/
const generateURLs = props => {
  const { data, actions } = props;
  const { uris } = data;

  if (!uris) {
    return null;
  }

  return uris.map((uri, index) => {
    return (
      <URL
        key={index}
        index={index}
        data={data}
        actions={actions}
      />
    );
  });
};

export default generateURLs;
