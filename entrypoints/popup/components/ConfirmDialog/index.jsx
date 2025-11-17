// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ConfirmDialog.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';

/** 
* Function to render the Popup Dialog component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function ConfirmDialog (props) {
  return (
    <div className={`${S.confirmDialog} ${props.open ? S.open : ''}`}>
      <div className={S.confirmDialogBackdrop} onClick={props.onCancel} />
      <div className={S.confirmDialogBox}>
        <h2>{props.message}</h2>
        {props.subMessage && <p>{props.subMessage}</p>}

        <div className={S.confirmDialogActions}>
          <button
            className={`${bS.btn} ${bS.btnClear}`}
            onClick={props.onCancel}
          >
            {props.cancelText}
          </button>
          <button
            className={`${bS.btn} ${bS.btnSimpleAction} ${bS.btnDanger} ${bS.btnCancel}`}
            onClick={props.onConfirm}
          >
            {props.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
