// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './TopBar.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Link, useLocation } from 'react-router';
import { useEffect, useRef, lazy, useCallback, useMemo, memo } from 'react';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import getKey from '@/partials/sessionStorage/getKey';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

const Logo = lazy(() => import('@/assets/logo.svg?react'));
const LogoDark = lazy(() => import('@/assets/logo-dark.svg?react'));
const LockedIcon = lazy(() => import('@/assets/popup-window/locked.svg?react'));
const LockIcon = lazy(() => import('@/assets/popup-window/lock.svg?react'));
const AddNewIcon = lazy(() => import('@/assets/popup-window/add-new.svg?react'));

/** 
* Function component for the TopBar.
* @return {JSX.Element} The rendered component.
*/
function TopBar () {
  const location = useLocation();
  const { logout } = useAuthActions();
  const { configured } = useAuthState();
  const { matchingLoginsLength } = useMatchingLogins();
  const unwatchConfigured = useRef(null);

  const watchConfigured = useCallback(async () => {
    const configuredKey = await getKey('configured');
    const oldValue = await getConfiguredBoolean();
    const uC = storage.watch(`session:${configuredKey}`, async () => {
      const newValue = await getConfiguredBoolean();

      if (newValue !== oldValue && newValue === false) {
        await logout(false);
      }
    });

    return uC;
  }, [logout]);

  const handleLockClick = useCallback(async () => {
    if (unwatchConfigured?.current && typeof unwatchConfigured?.current === 'function') {
      await unwatchConfigured.current();
    }

    await logout();
  }, [logout]);

  const logoClass = useMemo(() => 
    `${S.topbarLogo} ${(location.pathname === '/blocked' || location.pathname === '/') ? S.disabled : ''}`,
    [location.pathname]
  );

  const lockButtonDisabled = useMemo(() =>
    !configured || location.pathname === '/blocked',
    [configured, location.pathname]
  );

  const addNewClass = useMemo(() => {
    if (!configured) {
      return '';
    }

    return (parseInt(matchingLoginsLength, 10) || 0) <= 0 ? S.highlighted : S.active;
  }, [configured, matchingLoginsLength]);

  const addNewBtnClass = useMemo(() =>
    `${S.topbarAddNewBtn} ${location.pathname === '/add-new' || !configured ? S.disabled : ''}`,
    [configured, location.pathname]
  );

  const homePageTitle = useMemo(() => browser.i18n.getMessage('go_to_home_page'), []);
  const lockedText = useMemo(() => browser.i18n.getMessage('top_bar_locked'), []);
  const lockText = useMemo(() => browser.i18n.getMessage('top_bar_lock'), []);
  const addNewText = useMemo(() => browser.i18n.getMessage('top_bar_add_new'), []);

  useEffect(() => {
    watchConfigured().then(unwatch => {
      unwatchConfigured.current = unwatch;
    });
    
    return () => {
      if (unwatchConfigured.current) {
        unwatchConfigured.current();
      }
    };
  }, [watchConfigured]);

  return (
    <>
      <header className={S.topbar}>
        <div className={logoClass}>
          <Link
            to='/'
            title={homePageTitle}
            prefetch='render'
          >
            <Logo className="theme-light" />
            <LogoDark className="theme-dark" />
          </Link>
        </div>

        <div className={S.topbarLock}>
          <button
            className={`${bS.btn} ${bS.btnLocked}`}
            disabled={lockButtonDisabled}
            onClick={handleLockClick}
          >
            <span className={bS.btnLockedDisabled}>
              <span>{lockedText}</span>
              <LockedIcon />
            </span>
            
            <span className={bS.btnLockedActive}>
              <span>{lockText}</span>
              <LockIcon />
            </span>
          </button>
        </div>

        <div className={`${S.topbarAddNew} ${addNewClass}`}>
          <Link
            to='/add-new'
            className={addNewBtnClass}
            prefetch='intent'
          >
            <span>{addNewText}</span>
            <AddNewIcon />
          </Link>
        </div>
      </header>
    </>
  );
}

export default memo(TopBar);
