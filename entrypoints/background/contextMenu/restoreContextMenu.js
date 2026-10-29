// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import initContextMenu from './initContextMenu';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import { whenStorageInitialized } from '../migrations/initializeStorage';

/**
* Function to bring the context menu in line with the lock state when the background starts. Chrome restores the
* menu items of a reloaded extension (e.g. after "Allow in Incognito" is toggled) while storage.session is wiped and
* neither runtime.onInstalled nor runtime.onStartup fires, so a locked extension kept the items of the last session.
* An unlocked menu is left alone, because the configured state cannot survive a wiped storage.session.
* @async
* @return {Promise<boolean>} True if the menu was rebuilt, otherwise false.
*/
const restoreContextMenu = async () => {
  await whenStorageInitialized();

  const configured = await getConfiguredBoolean();

  if (configured) {
    return false;
  }

  await initContextMenu();

  return true;
};

export default restoreContextMenu;
