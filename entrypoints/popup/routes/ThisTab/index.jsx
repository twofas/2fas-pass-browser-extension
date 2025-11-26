// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ThisTab.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useState, useRef, useCallback, useMemo, memo, useContext } from 'react';
import { ScrollableRefContext } from '../../context/ScrollableRefProvider';
import getDomainFromTab from './functions/getDomainFromTab';
import onMessage from './events/onMessage';
import generateAllItemsList from './functions/generateAllItemsList';
import generateMatchingItemsList from './functions/generateMatchingItemsList';
import URIMatcher from '@/partials/URIMatcher';
import getItems from '@/partials/sessionStorage/getItems';
import getTags from '@/partials/sessionStorage/getTags';
import { filterXSS } from 'xss';
import sanitizeObject from '@/partials/functions/sanitizeObject';
import getDomainFromMessage from './functions/getDomainFromMessage';
import { useLocation } from 'react-router';
import keepPassword from './functions/keepPassword';
import { toast } from 'react-toastify';
import isItemsCorrect from './functions/isItemsCorrect';
import usePopupStateStore from '../../store/popupState';
import useScrollPosition from '../../hooks/useScrollPosition';
import SmallLoginItem from './components/SmallLoginItem';
import DomainIcon from '@/assets/popup-window/domain.svg?react';
import SearchIcon from '@/assets/popup-window/search-icon.svg?react';
import ClearIcon from '@/assets/popup-window/clear.svg?react';
import NoMatch from './components/NoMatch';
import ModelFilter from './components/ModelFilter';
import Filters from './components/Filters';
import Sort from './components/Sort';
import UpdateComponent from './components/UpdateComponent';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

const thisTabTopVariants = {
  visible: { height: 'auto', transition: { duration: 0.3 } },
  hidden: { height: '0', marginBottom: '-10px', borderWidth: '0', transition: { duration: 0 } }
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
  const scrollableRefContext = useContext(ScrollableRefContext);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('Unknown');
  const [url, setUrl] = useState('Unknown');
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [matchingLogins, setMatchingLogins] = useState([]);
  const [storageVersion, setStorageVersion] = useState(null);
  const [autofillFailed, setAutofillFailed] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [forceCloseFilters, setForceCloseFilters] = useState(false);

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);
  const setScrollPosition = usePopupStateStore(state => state.setScrollPosition);
  const setHref = usePopupStateStore(state => state.setHref);

  // Refs
  const boxAnimationRef = useRef(null);
  const boxAnimationDarkRef = useRef(null);
  const scrollableRef = useRef(null);
  const unwatchStorageVersion = useRef(null);
  const thisTabTopRef = useRef(null);

  useScrollPosition(scrollableRef, loading);

  useEffect(() => {
    if (scrollableRefContext?.setRef && scrollableRef.current) {
      scrollableRefContext.setRef(scrollableRef.current);
    }
  }, [scrollableRefContext]);

  const syncState = useCallback(() => {
    if (!location.state?.from) {
      return;
    }

    if (location.state?.data) {
      const fieldsToSync = [
        'lastSelectedTagInfo',
        'searchActive',
        'searchValue',
        'selectedTag'
      ];

      const updates = {};
      let hasChanges = false;

      fieldsToSync.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(location.state.data, field)) {
          updates[field] = location.state.data[field];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        const currentData = usePopupStateStore.getState().data;

        usePopupStateStore.setState({
          data: {
            ...currentData,
            ...updates
          }
        });
      }
    }

    if (location.state?.scrollPosition !== undefined) {
      setScrollPosition(location.state.scrollPosition);
    }

    if (location.state?.from === 'details') {
      setHref(location.pathname);
    }
  }, [location.state, location.pathname, setScrollPosition, setHref]);

  const handleSortChange = useCallback(async newSort => {
    setData('selectedSort', newSort);
  }, []);

  const handleSearchChange = useCallback(e => {
    const value = e?.target?.value;

    setForceCloseFilters(true);
    setTimeout(() => setForceCloseFilters(false), 100);

    if (value.trim().length > 0) {
      setData('searchActive', true);
      setData('searchValue', value);
    } else {
      setData('searchActive', false);
      setData('searchValue', '');
    }
  }, [setData]);

  const handleSearchClear = useCallback(() => {
    setData('searchValue', '');
    setData('searchActive', false);
  }, [setData]);

  const handleTagChange = useCallback((tag) => {
    setData('selectedTag', tag);

    if (tag) {
      const tagInfo = { name: tag.name, amount: tag.amount };
      setData('lastSelectedTagInfo', tagInfo);
    }
  }, [setData]);

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

    let items = [];
    let matchingLogins = [];

    try {
      items = await getItems();
    } catch (e) {
      await CatchError(e);
    }

    try {
      matchingLogins = URIMatcher.getMatchedAccounts(items, d.url);
    } catch {}

    setMatchingLogins(matchingLogins);

    setTimeout(() => {
      changeMatchingLoginsLength(matchingLogins?.length || 0);
    }, 200);

    setData('searchActive', false);
    setData('searchValue', '');
  }, [changeMatchingLoginsLength, setData]);

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

  const getStorageItems = useCallback(async () => {
    const i = await getItems();
    setItems(i);

    return i;
  }, []);

  const getStorageTags = useCallback(async () => {
    const t = await getTags();
    return t;
  }, []);

  const getTagsAmount = useCallback(async (tags, services) => {
    if (!Array.isArray(tags) || tags.length === 0) {
      setTags([]);
      return false;
    }

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

  const messageListener = useCallback((request, sender, sendResponse) => onMessage(request, sender, sendResponse, sendUrl, setUpdateAvailable), [sendUrl, setUpdateAvailable]);

  const hasMatchingLogins = useMemo(() => isItemsCorrect(matchingLogins) && matchingLogins?.length > 0, [matchingLogins]);
  const hasLogins = useMemo(() => isItemsCorrect(items) && items?.length > 0, [items]);

  const filteredItemsByModel = useMemo(() => {
    if (!data?.itemModelFilter) {
      return items;
    }

    return items.filter(item => item?.constructor?.name === data.itemModelFilter);
  }, [items, data?.itemModelFilter]);

  const tagsWithFilteredAmounts = useMemo(() => {
    if (!Array.isArray(tags) || tags.length === 0) {
      return [];
    }

    const itemsToCount = filteredItemsByModel;
    const servicesWithTags = itemsToCount.filter(service => service?.tags && Array.isArray(service?.tags) && service?.tags?.length > 0);

    return tags.map(tag => {
      let amount = 0;

      for (const service of servicesWithTags) {
        if (service.tags.includes(tag.id)) {
          amount += 1;
        }
      }

      return { ...tag, amount };
    });
  }, [tags, filteredItemsByModel]);

  const searchPlaceholder = useMemo(() => {
    let amount;

    if (data?.selectedTag) {
      const tagWithFilteredAmount = tagsWithFilteredAmounts.find(t => t.id === data.selectedTag.id);
      amount = tagWithFilteredAmount?.amount || 0;
    } else {
      amount = filteredItemsByModel?.length || 0;
    }

    return browser.i18n.getMessage('this_tab_search_placeholder').replace('%AMOUNT%', amount);
  }, [data?.selectedTag, filteredItemsByModel?.length, tagsWithFilteredAmounts]);

  const currentTagInfo = useMemo(() => {
    if (!data?.selectedTag || !data?.lastSelectedTagInfo) {
      return null;
    }

    const tagWithFilteredAmount = tagsWithFilteredAmounts.find(t => t.id === data.selectedTag.id);

    return {
      name: data.lastSelectedTagInfo.name,
      amount: tagWithFilteredAmount?.amount || 0
    };
  }, [data?.selectedTag, data?.lastSelectedTagInfo, tagsWithFilteredAmounts]);

  const autofillPopupClass = `${S.thisTabAutofillPopup} ${autofillFailed ? S.active : ''}`;
  const matchingLoginsListClass = `${S.thisTabMatchingLoginsList} ${hasMatchingLogins || loading ? S.active : ''}`;
  const allLoginsClass = `${S.thisTabAllLogins} ${!hasLogins && !loading ? S.hidden : ''}`;
  const searchClass = `${S.thisTabAllLoginsSearch} ${data?.searchActive ? S.active : ''}`;

  const memoizedMatchingItemsList = useMemo(() => generateMatchingItemsList(matchingLogins, loading), [matchingLogins, loading]);
  const memoizedAllItemsList = useMemo(() => generateAllItemsList(items, data.selectedSort, data?.searchValue, loading, tags, data?.selectedTag, data?.itemModelFilter), [items, data.selectedSort, data?.searchValue, loading, tags, data?.selectedTag, data?.itemModelFilter]);

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

    Promise.all([ getDomain(), getStorageItems(), getStorageTags() ])
      .then(([domain, items, tags]) => Promise.all([
        getMatchingLogins(items, domain),
        getTagsAmount(tags, items)
      ]))
      .then(() => {
        if (items.length === 0) {
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
    if (location?.state?.action === 'autofillT2Failed') {
      setAutofillFailed(true);
    } else {
      setAutofillFailed(false);
    }

    if (location.state?.from === 'details') {
      setTimeout(() => {
        syncState();
      }, 0);
    }
  }, [location?.state, syncState]);

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div ref={scrollableRef}>
          <section className={S.thisTab}>
            <div className={autofillPopupClass}>
              <div className={S.thisTabAutofillPopupBox}>
                <h2>Password for the following service successfully fetched.</h2>
                <div className={S.thisTabAutofillPopupBoxLoginItem}>
                  <SmallLoginItem
                    deviceId={state?.deviceId}
                    vaultId={state?.vaultId}
                    itemId={state?.itemId}
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
                animate={data?.searchActive || data?.selectedTag ? 'hidden' : 'visible'}
                onAnimationComplete={e => {
                  if (e === 'visible') {
                    thisTabTopRef.current.style.overflow = 'visible';
                  } else if (e === 'hidden') {
                    thisTabTopRef.current.style.overflow = 'clip';
                  }
                }}
                onUpdate={() => {
                  if (data?.searchActive || data?.selectedTag) {
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
                    {memoizedMatchingItemsList}
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
                  <ModelFilter />
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
                      value={data.searchValue || ''}
                      className={data?.searchValue && data?.searchValue?.length > 0 ? S.withValue : ''}
                    />
        
                    <button
                      className={`${S.thisTabAllLoginsSearchClear} ${!data?.searchValue || data?.searchValue?.length <= 0 ? S.hidden : ''}`}
                      onClick={handleSearchClear}
                    >
                      <ClearIcon />
                    </button>
                  </div>
                  <Filters
                    tags={tagsWithFilteredAmounts}
                    selectedTag={data.selectedTag}
                    onTagChange={handleTagChange}
                    forceClose={forceCloseFilters}
                  />
                  <Sort
                    selectedSort={data.selectedSort || 'az'}
                    onSortChange={handleSortChange}
                  />
                </div>

                <div className={`${S.thisTabAllLoginsTagsInfo} ${currentTagInfo && data.selectedTag ? S.active : ''}`}>
                  <div
                    className={S.thisTabAllLoginsTagsInfoBox}
                    title={browser.i18n.getMessage('this_tab_tag_info_text').replace('AMOUNT', currentTagInfo?.amount || '').replace('TAG_NAME', currentTagInfo?.name || '')}
                  >
                    <p>{browser.i18n.getMessage('this_tab_tag_info_text').replace('AMOUNT', currentTagInfo?.amount || '').replace('TAG_NAME', currentTagInfo?.name || '')}</p>
                    <button
                      onClick={() => setData('selectedTag', null)}
                      title={browser.i18n.getMessage('this_tab_clear_tag_filter')}
                    >
                      <ClearIcon />
                    </button>
                  </div>
                </div>

                {memoizedAllItemsList}
              </div>
            </div>
          </section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default memo(ThisTab);
