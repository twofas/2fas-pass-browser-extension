// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Details.module.scss';
import * as m from 'motion/react-m';
import { Link } from 'react-router';
import { lazy } from 'react';
import { PULL_REQUEST_TYPES } from '@/constants';

const ChevronIcon = lazy(() => import('@/assets/popup-window/chevron.svg?react'));

const dangerZoneVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '73px' }
};

 /**
* Function to render the danger zone section.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function DangerZone (props) {
  const { data, actions } = props;
  const { service, dangerZoneOpened, submitting } = data;
  const { setDangerZoneOpened } = actions;

  return (
    <div className={S.detailsDangerZone}>
      <button
        type="button"
        className={`${S.detailsDangerZoneButton} ${dangerZoneOpened ? S.active : ''}`}
        onClick={() => setDangerZoneOpened(!dangerZoneOpened)}
        disabled={submitting ? 'disabled' : ''}
      >
        <span>{browser.i18n.getMessage('danger_zone')}</span>
        <ChevronIcon />
      </button>

      <m.div
        className={S.detailsDangerZoneBody}
        variants={dangerZoneVariants}
        initial='hidden'
        transition={{ duration: 0.3 }}
        animate={dangerZoneOpened ? 'visible' : 'hidden'}
      >
        <p>{browser.i18n.getMessage('details_delete_header')}</p>
        <Link
          to='/fetch'
          state={{ action: PULL_REQUEST_TYPES.DELETE_DATA, from: 'details', data: { itemId: service.id, deviceId: service.deviceId } }}
          className={S.detailsDangerZoneBodyButton}
          prefetch='intent'
        >
          <span>{browser.i18n.getMessage('details_delete')}</span>
        </Link>
      </m.div>
    </div>
  );
}

export default DangerZone;
