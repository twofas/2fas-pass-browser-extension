// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { useEffect, useState, Fragment, useCallback } from 'react';
import { useI18n } from '@/partials/context/I18nContext';

/**
* Function to render the Shortcut component.
* @return {JSX.Element} The rendered component.
*/
function Shortcut () {
  const { getMessage } = useI18n();
  const [shortcut, setShortcut] = useState(null);
  const [shortcutLink, setShortcutLink] = useState('#');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const getShortcut = async () => {
      let commands;

      try {
        commands = await browser.commands.getAll();
      } catch {
        setIsInitialized(true);
        return;
      }

      const command = commands?.find(c => c.name === '2fas_pass_shortcut_autofill');

      if (command?.shortcut) {
        let shortcutText = command.shortcut
          .replace(/⌘/g, 'Cmd+')
          .replace(/⇧/g, 'Shift+')
          .replace(/⌥/g, 'Alt+')
          .replace(/⌃/g, 'Ctrl+');

        if (shortcutText[shortcutText.length - 1] === '+') {
          shortcutText = shortcutText.slice(0, -1);
        }

        setShortcut(shortcutText);
      }

      setIsInitialized(true);
    };

    try {
      getShortcut();
    } catch (e) {
      CatchError(e);
      setIsInitialized(true);
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
    <div className={pI.passInputShortcutBoxKey}>
      {isInitialized ? getMessage('settings_unknown').toUpperCase() : '\u00A0'}
    </div>
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

  const onEditShortcut = useCallback(async () => {
    if (import.meta.env.BROWSER === 'safari') {
      return false;
    }

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
      showToast(getMessage('error_feature_wrong_data'), 'error');
    }
  }, [shortcutLink]);

  if (
    import.meta.env.BROWSER === 'safari' && 
    (!browser?.commands?.getAll || typeof browser?.commands?.getAll !== 'function')
  ) {
    return null;
  }

  return (
    <div className={S.settingsShortcut}>
      <div className={pI.passInput}>
        <div className={`${pI.passInputTop} ${((shortcutLink === 'firefox' && !openShortcutSettingsAvailable()) || (shortcutLink === 'safari')) ? S.settingsShortcutFirefoxInput : ''}`}>
          <label htmlFor="shortcut">{getMessage('settings_shortcut')}</label>
          <button
            type='button'
            className={`${bS.btn} ${bS.btnClear} ${((shortcutLink === 'firefox' && !openShortcutSettingsAvailable()) || (shortcutLink === 'safari')) ? S.settingsShortcutFirefoxBtn : ''}`} 
            onClick={onEditShortcut}
          >
            {{
              'firefox': openShortcutSettingsAvailable() ? getMessage('edit') : getMessage('info'),
              'safari': getMessage('info')
            }[shortcutLink] || getMessage('edit')}
          </button>
          {
            import.meta.env.BROWSER === 'firefox' ? (
              <div className={`${S.settingsShortcutFirefoxTooltip}`}>
                <p>{getMessage('settings_shortcut_firefox_tooltip')}</p>
              </div>
            ) : null
          }
          {
            import.meta.env.BROWSER === 'safari' ? (
              <div className={`${S.settingsShortcutFirefoxTooltip}`}>
                <p>{getMessage('settings_shortcut_safari_tooltip')}</p>
              </div>
            ) : null
          }
        </div>
        <div className={pI.passInputDescription}>
          <p>{getMessage('settings_shortcut_description')}</p>
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
