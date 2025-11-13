// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './TopBar.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Link, useLocation } from 'react-router';
import { useEffect, useRef, useState, lazy, useCallback, useMemo, memo } from 'react';
import { useAuthActions, useAuthState } from '@/hooks/useAuth';
import getKey from '@/partials/sessionStorage/getKey';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import Select from 'react-select';
import AddNewCustomOption from './components/AddNewCustomOption';
import { addNewOptions } from '@/constants';

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
  const addNewContainerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    `${S.topbarLogo} ${(location.pathname === '/blocked' || location.pathname === '/' || location.pathname === '/connect') ? S.disabled : ''}`,
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

  const addNewBtnClass = useMemo(() => {
    const path = location.pathname;
    let returnClass = S.topbarAddNewBtn;

    if (
      path === '/fetch' ||
      path.startsWith('/fetch/') ||
      path === '/fetch-external' ||
      path.startsWith('/fetch-external/') ||
      !configured
    ) {
      returnClass += ` ${S.disabled}`;
    }

    return returnClass;
  }, [configured, location.pathname]);

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

  useEffect(() => {
    const handleClickOutside = event => {
      if (isMenuOpen && addNewContainerRef.current && !addNewContainerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className={S.topbar}>
        <div className={logoClass}>
          <Link
            to='/'
            title={browser.i18n.getMessage('go_to_home_page')}
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
              <span>{browser.i18n.getMessage('top_bar_locked')}</span>
              <LockedIcon />
            </span>

            <span className={bS.btnLockedActive}>
              <span>{browser.i18n.getMessage('top_bar_lock')}</span>
              <LockIcon />
            </span>
          </button>
        </div>

        <div className={`${S.topbarAddNew} ${addNewClass}`} ref={addNewContainerRef}>
          <button
            className={addNewBtnClass}
            type='button'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span>{browser.i18n.getMessage('top_bar_add_new')}</span>
            <AddNewIcon />
          </button>

          <Select
            options={addNewOptions}
            value={null}
            menuIsOpen={isMenuOpen}
            onMenuClose={() => setIsMenuOpen(false)}
            onMenuOpen={() => setIsMenuOpen(true)}
            className='react-select-add-new-container'
            classNamePrefix='react-select-add-new'
            isClearable={false}
            isSearchable={false}
            noOptionsMessage={() => null}
            components={{
              Option: props => <AddNewCustomOption {...props} setIsMenuOpen={setIsMenuOpen} />
            }}
          />
        </div>
      </header>
    </>
  );
}

export default memo(TopBar);
