// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './NotFound.module.scss';
import { useEffect } from 'react';

/**
* Function to render the Not Found component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function NotFound (props) {
  useEffect(() => {
    try {
      throw new TwoFasError(TwoFasError.internalErrors.notFoundRoute);
    } catch (e) {
      CatchError(e);
    }
  }, []);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.notFound}>
          <h1>{browser.i18n.getMessage('not_found_text')}</h1>
        </section>
      </div>
    </div>
  );
}

export default NotFound;
