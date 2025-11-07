// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ConfirmDialog.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useRef, useEffect } from 'react';

/** 
* Function to render the Popup Dialog component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function ConfirmDialog (props) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (props.open) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [props.open]);

  return (
    <dialog
      className={S.confirmDialog}
      ref={dialogRef}
    >
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
    </dialog>
  );
}

export default ConfirmDialog;
