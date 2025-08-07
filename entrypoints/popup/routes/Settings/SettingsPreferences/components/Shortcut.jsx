// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { useEffect, useState, Fragment } from 'react';

/**
* Function to render the Shortcut component.
* @return {JSX.Element} The rendered component.
*/
function Shortcut () {
  const [shortcut, setShortcut] = useState(null);
  const [shortcutLink, setShortcutLink] = useState('#');

  if (import.meta.env.BROWSER === 'safari') {
    return null;
  }

  useEffect(() => {
    const getShortcut = async () => {
      let commands;

      try {
        commands = await browser.commands.getAll();
      } catch {}

      const command = commands.find(c => c.name === '2fas_pass_shortcut_autofill');
      let shortcutText = command
        .shortcut
        .replace(/⌘/g, 'Cmd+')
        .replace(/⇧/g, 'Shift+')
        .replace(/⌥/g, 'Alt+')
        .replace(/⌃/g, 'Ctrl+');

      if (shortcutText[shortcutText.length - 1] === '+') {
        shortcutText = shortcutText.slice(0, -1);
      }

      setShortcut(shortcutText);
    };

    try {
      getShortcut();
    } catch (e) {
      CatchError(e);
    }

    switch (import.meta.env.BROWSER) {
      case 'chrome': {
        setShortcutLink('chrome://extensions/shortcuts');
        break;
      }

      case 'edge': {
        setShortcutLink('edge://extensions/shortcuts');
        break;
      }

      case 'opera': {
        setShortcutLink('opera://extensions/shortcuts');
        break;
      }

      case 'firefox': {
        setShortcutLink('firefox');
        break;
      }

      case 'safari': {
        setShortcutLink('safari');
        break;
      }
      
      default: {
        break;
      }
    }
  }, []);

  const EmptyShortcutBox = () => (
    <div className={pI.settingsShortcutBoxKey}>{browser.i18n.getMessage('settings_unknown').toUpperCase()}</div>
  );

  const ShortcutBox = () => {
    if (!shortcut || shortcut.length <= 0) {
      return <EmptyShortcutBox />;
    }

    const data = shortcut.split('+');
    const elements = [];
    const shortcutLength = data.length;

    data.forEach((btn, i) => {
      const filteredBtn = btn?.replace('MacCtrl', 'Ctrl');

      elements.push(
        <Fragment key={i}>
          <div className={pI.passInputShortcutBoxKey} key={i}>
            {filteredBtn}
          </div>
          {i !== shortcutLength - 1 ? <div className={pI.passInputShortcutBoxPlus}>+</div> : null }
        </Fragment>
      );
    });

    return (
      <>
        {elements}
      </>
    );
  };

  const openShortcutSettingsAvailable = () => {
    return browser?.commands?.openShortcutSettings && typeof browser?.commands?.openShortcutSettings === 'function';
  };

  const onEditShortcut = async () => {
    if (shortcutLink === 'firefox') {
      if (openShortcutSettingsAvailable()) {
        return browser.commands.openShortcutSettings();
      }

      return false;
    }

    const res = await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.OPEN_BROWSER_PAGE,
      target: REQUEST_TARGETS.BACKGROUND,
      url: shortcutLink
    });

    if (res.status === 'error') {
      showToast(browser.i18n.getMessage('error_feature_wrong_data'), 'error');
    }
  };

  return (
    <div className={S.settingsShortcut}>
      <div className={pI.passInput}>
        <div className={`${pI.passInputTop} ${(shortcutLink === 'firefox' && !openShortcutSettingsAvailable()) ? S.settingsShortcutFirefoxInput : ''}`}>
          <label htmlFor="shortcut">{browser.i18n.getMessage('settings_shortcut')}</label>
          {
            import.meta.env.BROWSER === 'safari' ? null : (
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear} ${(shortcutLink === 'firefox' && !openShortcutSettingsAvailable()) ? S.settingsShortcutFirefoxBtn : ''}`} 
                onClick={onEditShortcut}
              >
                {shortcutLink === 'firefox' ?
                (openShortcutSettingsAvailable() ? browser.i18n.getMessage('edit') : browser.i18n.getMessage('info')) :
                browser.i18n.getMessage('edit')}
              </button>
            )
          }
          <div className={`${S.settingsShortcutFirefoxTooltip}`}>
            <p>{browser.i18n.getMessage('settings_shortcut_firefox_tooltip')}</p>
          </div>
        </div>
        <div className={pI.passInputDescription}>
          <p>{browser.i18n.getMessage('settings_shortcut_description')}</p>
        </div>
        <div className={pI.passInputShortcut}>
          <div className={pI.passInputShortcutBox}>
            <ShortcutBox />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shortcut;
