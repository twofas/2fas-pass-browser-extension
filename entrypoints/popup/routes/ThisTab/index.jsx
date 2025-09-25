// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ThisTab.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useState, useRef, lazy, useCallback, useMemo, memo } from 'react';
import getDomainFromTab from './functions/getDomainFromTab';
import onMessage from './events/onMessage';
import generateAllLoginsList from './functions/generateAllLoginsList';
import generateMatchingLoginsList from './functions/generateMatchingLoginsList';
import URIMatcher from '@/partials/URIMatcher';
import getServices from '@/partials/sessionStorage/getServices';
import getTags from '@/partials/sessionStorage/getTags';
import { filterXSS } from 'xss';
import sanitizeObject from '@/partials/functions/sanitizeObject';
import getDomainFromMessage from './functions/getDomainFromMessage';
import { useLocation } from 'react-router';
import keepPassword from './functions/keepPassword';
import { toast } from 'react-toastify';
import isLoginsCorrect from './functions/isLoginsCorrect';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const SmallLoginItem = lazy(() => import('./components/SmallLoginItem'));
const DomainIcon = lazy(() => import('@/assets/popup-window/domain.svg?react'));
const SearchIcon = lazy(() => import('@/assets/popup-window/search-icon.svg?react'));
const ClearIcon = lazy(() => import('@/assets/popup-window/clear.svg?react'));
const SortUpIcon = lazy(() => import('@/assets/popup-window/sort-up.svg?react'));
const SortDownIcon = lazy(() => import('@/assets/popup-window/sort-down.svg?react'));
const NoMatch = lazy(() => import('./components/NoMatch'));
const Filters = lazy(() => import('./components/Filters'));
const UpdateComponent = lazy(() => import('./components/UpdateComponent'));

const thisTabTopVariants = {
  visible: { height: 'auto', transition: { duration: 0.3 } },
  hidden: { height: '0', marginBottom: '-24px', transition: { duration: 0 } }
};

/** 
* Function to render the main content of the ThisTab component.
* @param {Object} props - The component props.
* @return {JSX.Element} Element representing the ThisTab component.
*/
function ThisTab (props) {
  const location = useLocation();
  const { state } = location;
  const { changeMatchingLoginsLength } = useMatchingLogins();
  
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('Unknown');
  const [url, setUrl] = useState('Unknown');
  const [logins, setLogins] = useState([]);
  const [tags, setTags] = useState([]);
  const [matchingLogins, setMatchingLogins] = useState([]);
  const [sort, setSort] = useState(false); // false - asc, true - desc
  const [sortDisabled, setSortDisabled] = useState(true);
  const [storageVersion, setStorageVersion] = useState(null);
  const [autofillFailed, setAutofillFailed] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const getInitialValue = (key, fallback = null) => {
    if (location?.state?.data?.[key] !== undefined) {
      return location.state.data[key];
    }


    return fallback;
  };

  // Search
  const [searchActive, setSearchActive] = useState(getInitialValue('searchActive', false));
  const [searchValue, setSearchValue] = useState(getInitialValue('searchValue', ''));
  const [selectedTag, setSelectedTag] = useState(getInitialValue('selectedTag', null));
  const [lastSelectedTagInfo, setLastSelectedTagInfo] = useState(getInitialValue('lastSelectedTagInfo', null));
  const [forceCloseFilters, setForceCloseFilters] = useState(false);

  const boxAnimationRef = useRef(null);
  const boxAnimationDarkRef = useRef(null);
  const scrollableRef = useRef(null);
  const unwatchStorageVersion = useRef(null);
  const thisTabTopRef = useRef(null);


  const handleSortClick = useCallback(async () => {
    setSortDisabled(true);

    try {
      const newSort = !sort;
      setSort(newSort);
      await storage.setItem('local:allLoginsSort', newSort);
    } catch (e) {
      await CatchError(e);
    } finally {
      setSortDisabled(false);
    }
  }, [sort]);



  const handleSearchChange = useCallback(e => {
    const value = e?.target?.value;

    setForceCloseFilters(true);
    setTimeout(() => setForceCloseFilters(false), 100);

    if (value.trim().length > 0) {
      setSearchActive(true);
      setSearchValue(value);
    } else {
      setSearchActive(false);
      setSearchValue('');
    }
  });

  const handleSearchClear = useCallback(() => {
    setSearchValue('');
    setSearchActive(false);
  });

  const handleTagChange = useCallback((tag) => {
    setSelectedTag(tag);

    if (tag) {
      const tagInfo = { name: tag.name, amount: tag.amount };
      setLastSelectedTagInfo(tagInfo);
    }
  });

  const handleKeepPassword = useCallback(async () => {
    await keepPassword(state);
    window.history.replaceState({}, '');
    setAutofillFailed(false);

    if (state?.toastId) {
      toast.dismiss(state?.toastId);
    }
  }, [state]);

  const handleDontKeepPassword = useCallback(() => {
    setAutofillFailed(false);
    window.history.replaceState({}, '');
    
    if (state?.toastId) {
      toast.dismiss(state?.toastId);
    }
  }, [state]);

  const sendUrl = useCallback(async request => {
    const d = getDomainFromMessage(request);
    setDomain(d.domain);
    setUrl(d.url);

    let logins = [];
    let matchingLogins = [];

    try {
      logins = await getServices();
    } catch (e) {
      await CatchError(e);
    }

    try {
      matchingLogins = URIMatcher.getMatchedAccounts(logins, d.url);
    } catch {}

    setMatchingLogins(matchingLogins);

    setTimeout(() => {
      changeMatchingLoginsLength(matchingLogins?.length || 0);
    }, 200);

    setSearchActive(false);
    setSearchValue('');
  }, [changeMatchingLoginsLength]);

  const watchStorageVersion = useCallback(() => {
    const uSV = storage.watch('session:storageVersion', async newValue => {
      setStorageVersion(newValue);
    });

    return uSV;
  }, []);

  const getDomain = useCallback(async () => {
    const d = await getDomainFromTab();
    setDomain(filterXSS(d.domain));
    setUrl(filterXSS(d.url));
    return filterXSS(d.url);
  }, []);

  const getLogins = useCallback(async () => {
    const l = await getServices();
    setLogins(l);
    
    return l;
  }, []);

  const getStorageTags = useCallback(async () => {
    const t = await getTags();
    return t;
  }, []);

  const getTagsAmount = useCallback(async (tags, services) => {
    const servicesWithTags = services.filter(service => service?.tags && Array.isArray(service?.tags) && service?.tags?.length > 0);

    for (const service of servicesWithTags) {
      for (const tag of service.tags) {
        const tagIndex = tags.findIndex(t => t.id === tag);

        if (tagIndex === -1) {
          await CatchError(new TwoFasError(TwoFasError.internalErrors.tagIndexError, { additional: { tagId: tag } }));
          continue;
        }

        if (!tags[tagIndex]?.amount || !Number.isInteger(tags[tagIndex]?.amount)) {
          tags[tagIndex].amount = 0;
        }

        tags[tagIndex].amount += 1;
      }
    }

    tags.sort((a, b) => a.name.localeCompare(b.name));

    setTags(sanitizeObject(tags));
    return true;
  }, []);

  const getMatchingLogins = useCallback(async (logins, domain) => {
    let matchingLogins = [];

    try {
      matchingLogins = URIMatcher.getMatchedAccounts(logins, domain);
    } catch {}

    setMatchingLogins(sanitizeObject(matchingLogins));
    changeMatchingLoginsLength(matchingLogins?.length || 0);
    setLoading(false);
  }, [changeMatchingLoginsLength]);

  const getSort = useCallback(async () => {
    const s = await storage.getItem('local:allLoginsSort');
    setSort(s);
    return null;
  }, []);

  const messageListener = useCallback((request, sender, sendResponse) => onMessage(request, sender, sendResponse, sendUrl, setUpdateAvailable), [sendUrl, setUpdateAvailable]);

  const hasMatchingLogins = useMemo(() => isLoginsCorrect(matchingLogins) && matchingLogins?.length > 0, [matchingLogins]);
  const hasLogins = useMemo(() => isLoginsCorrect(logins) && logins?.length > 0, [logins]);
  const searchPlaceholder = useMemo(() => {
    const amount = selectedTag ? (selectedTag.amount || 0) : (logins?.length || 0);
    return browser.i18n.getMessage('this_tab_search_placeholder').replace('%AMOUNT%', amount);
  }, [selectedTag, logins?.length]);

  const autofillPopupClass = `${S.thisTabAutofillPopup} ${autofillFailed ? S.active : ''}`;
  const matchingLoginsListClass = `${S.thisTabMatchingLoginsList} ${hasMatchingLogins || loading ? S.active : ''}`;
  const allLoginsClass = `${S.thisTabAllLogins} ${!hasLogins && !loading ? S.hidden : ''}`;
  const searchClass = `${S.thisTabAllLoginsSearch} ${searchActive ? S.active : ''}`;
  const clearButtonClass = `${S.thisTabAllLoginsSearchClear} ${searchValue?.length <= 0 ? S.hidden : ''}`;

  const memoizedMatchingLoginsList = useMemo(() => generateMatchingLoginsList(matchingLogins, loading), [matchingLogins, loading]);
  const memoizedAllLoginsList = useMemo(() => generateAllLoginsList(logins, sort, searchValue, loading, tags, selectedTag), [logins, sort, searchValue, loading, tags, selectedTag]);

  useEffect(() => {
    browser.runtime.onMessage.addListener(messageListener);

    if (browser?.runtime?.requestUpdateCheck && typeof browser?.runtime?.requestUpdateCheck === 'function') {
      browser.runtime.requestUpdateCheck()
        .then(([status]) => {
          if (status === 'update_available') {
            setUpdateAvailable(true);
          }
      })
      .catch(() => {});
    }

    Promise.all([ getDomain(), getLogins(), getSort(), getStorageTags() ])
      .then(([domain, logins, , tags]) => Promise.all([
        getMatchingLogins(logins, domain),
        getTagsAmount(tags, logins)
      ]))
      .then(() => {
        setSortDisabled(false);

        if (logins.length === 0) {
          setTimeout(() => {
            if (boxAnimationRef?.current?.play) {
              boxAnimationRef.current.play();
            }

            if (boxAnimationDarkRef?.current?.play) {
              boxAnimationDarkRef.current.play();
            }
          }, 700);
        }

        return watchStorageVersion();
      })
      .then(unwatch => { unwatchStorageVersion.current = unwatch; })
      .catch(async e => { await CatchError(e); });

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);

      if (unwatchStorageVersion.current) {
        unwatchStorageVersion.current();
      }
    };
  }, [storageVersion]);

  useEffect(() => {
    if (state?.action === 'autofillT2Failed') {
      setAutofillFailed(true);
    } else {
      setAutofillFailed(false);
    }
  }, [state]);


  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div ref={el => {
          scrollableRef.current = el;
        }}>
          <section className={S.thisTab}>
            <div className={autofillPopupClass}>
              <div className={S.thisTabAutofillPopupBox}>
                <h2>Password for the following service successfully fetched.</h2>
                <div className={S.thisTabAutofillPopupBoxLoginItem}>
                  <SmallLoginItem
                    loginId={state?.loginId}
                    state={state}
                    setAutofillFailed={setAutofillFailed}
                  />
                </div>
                <div className={S.thisTabAutofillPopupBoxButtons}>
                  <button
                    className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
                    onClick={handleKeepPassword}
                  >
                    Keep it for 3 minutes
                  </button>
                  <button
                    className={`${bS.btn} ${bS.btnClear}`}
                    onClick={handleDontKeepPassword}
                  >
                    Don't keep it
                  </button>
                </div>
              </div>
            </div>

            <div className={S.thisTabContainer}>
              <m.div
                ref={thisTabTopRef}
                className={S.thisTabTop}
                variants={thisTabTopVariants}
                initial="visible"
                animate={searchActive || selectedTag ? 'hidden' : 'visible'}
                onAnimationComplete={e => {
                  if (e === 'visible') {
                    thisTabTopRef.current.style.overflow = 'visible';
                  } else if (e === 'hidden') {
                    thisTabTopRef.current.style.overflow = 'clip';
                  }
                }}
                onUpdate={() => {
                  if (searchActive || selectedTag) {
                    scrollableRef.current.scrollTo(0, 0);
                  }
                }}
                style={{ opacity: '1 !important'}}
              >
                <UpdateComponent updateAvailable={updateAvailable} />

                <div className={S.thisTabHeader}>
                  <h1>
                    {hasMatchingLogins ? browser.i18n.getMessage('this_tab_matching_logins_header') : browser.i18n.getMessage('this_tab_matching_logins_header_no_logins')}
                  </h1>
                  <h2 title={url}>
                    <DomainIcon />
                    <span>{domain}</span>
                  </h2>
                </div>

                <div className={S.thisTabMatchingLogins}>
                  <div className={matchingLoginsListClass}>
                    {memoizedMatchingLoginsList}
                  </div>

                  <NoMatch
                    matchingLoginsLength={matchingLogins?.length}
                    loading={loading}
                    boxAnimationRef={boxAnimationRef}
                    boxAnimationDarkRef={boxAnimationDarkRef}
                  />
                </div>
              </m.div>

              <div className={allLoginsClass}>
                <div className={S.thisTabAllLoginsHeader}>
                  <h3>{browser.i18n.getMessage('this_tab_all_logins_header')}</h3>

                  <div className={S.thisTabAllLoginsHeaderSort}>
                    <span>{browser.i18n.getMessage('this_tab_sort')}:</span>
                    <button className={`${sort ? S.desc : S.asc}`} onClick={handleSortClick} disabled={sortDisabled}>
                      <SortUpIcon />
                      <SortDownIcon />
                    </button>
                  </div>
                </div>

                <div className={S.thisTabAllLoginsSearchContainer}>
                  <div className={searchClass}>
                    <SearchIcon />
                    <input
                      id="search"
                      name="search"
                      type="search"
                      placeholder={searchPlaceholder}
                      dir="ltr"
                      spellCheck="false"
                      autoCorrect="off"
                      autoComplete="off"
                      autoCapitalize="off"
                      maxLength="2048"
                      onChange={handleSearchChange}
                      value={searchValue}
                    />
        
                    <button
                      className={clearButtonClass}
                      onClick={handleSearchClear}
                    >
                      <ClearIcon />
                    </button>
                  </div>
                  {
                    tags.length > 0 ?
                    <Filters
                      tags={tags}
                      selectedTag={selectedTag}
                      onTagChange={handleTagChange}
                      forceClose={forceCloseFilters}
                    /> :
                    null}
                </div>

                <div className={`${S.thisTabAllLoginsTagsInfo} ${lastSelectedTagInfo && selectedTag ? S.active : ''}`}>
                  <div 
                    className={S.thisTabAllLoginsTagsInfoBox}
                    title={browser.i18n.getMessage('this_tab_tag_info_text').replace('AMOUNT', lastSelectedTagInfo?.amount || '').replace('TAG_NAME', lastSelectedTagInfo?.name || '')}
                  >
                    <p>{browser.i18n.getMessage('this_tab_tag_info_text').replace('AMOUNT', lastSelectedTagInfo?.amount || '').replace('TAG_NAME', lastSelectedTagInfo?.name || '')}</p>
                    <button 
                      onClick={() => setSelectedTag(null)}
                      title={browser.i18n.getMessage('this_tab_clear_tag_filter')}
                    >
                      <ClearIcon />
                    </button>
                  </div>
                </div>

                {memoizedAllLoginsList}
              </div>
            </div>
          </section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default memo(ThisTab);
