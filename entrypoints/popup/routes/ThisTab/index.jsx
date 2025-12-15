// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ThisTab.module.scss';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useState, useRef, useCallback, useMemo, memo, useContext } from 'react';
import { ScrollableRefContext } from '../../context/ScrollableRefProvider';
import getDomainFromTab from './functions/getDomainFromTab';
import onMessage from './events/onMessage';
import URIMatcher from '@/partials/URIMatcher';
import getItems from '@/partials/sessionStorage/getItems';
import getTags from '@/partials/sessionStorage/getTags';
import { filterXSS } from 'xss';
import sanitizeObject from '@/partials/functions/sanitizeObject';
import getDomainFromMessage from './functions/getDomainFromMessage';
import { useLocation } from 'react-router';
import isItemsCorrect from './functions/isItemsCorrect';
import usePopupState from '../../store/popupState/usePopupState';
import useScrollPosition from '../../hooks/useScrollPosition';
import { useTagFilter } from './components/Filters/hooks/useTagFilter';
import { useSortFilter } from './components/Sort/hooks/useSortFilter';
import DomainIcon from '@/assets/popup-window/domain.svg?react';
import { AllItemsList, Filters, KeepPassword, MatchingItemsList, ModelFilter, NoMatch, Search, Sort, TagsInfo, UpdateComponent } from './components';
import { ItemListProvider } from './context/ItemListContext';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

const thisTabTopVariants = {
  visible: { height: 'auto', transition: { duration: 0.2, ease: 'easeOut' } },
  hidden: { height: '0', marginBottom: '-10px', borderWidth: '0', transition: { duration: 0, ease: 'easeOut' } }
};

/** 
* Function to render the main content of the ThisTab component.
* @param {Object} props - The component props.
* @return {JSX.Element} Element representing the ThisTab component.
*/
function ThisTab (props) {
  const location = useLocation();
  const { changeMatchingLoginsLength } = useMatchingLogins();
  const scrollableRefContext = useContext(ScrollableRefContext);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('Unknown');
  const [url, setUrl] = useState('Unknown');
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [matchingLogins, setMatchingLogins] = useState([]);
  const [storageVersion, setStorageVersion] = useState(null);

  const { data, setBatchData, setScrollPosition, setHref, pathname } = usePopupState();

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
        setBatchData(updates);
      }
    }

    if (location.state?.scrollPosition !== undefined) {
      setScrollPosition(location.state.scrollPosition);
    }

    if (location.state?.from === 'details') {
      setHref(pathname);
    }
  }, [location.state, pathname, setScrollPosition, setHref, setBatchData]);

  const { handleSortChange } = useSortFilter();
  const { handleTagChange } = useTagFilter();

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

    setBatchData({ searchActive: false, searchValue: '' });
  }, [changeMatchingLoginsLength, setBatchData]);

  const watchStorageVersion = useCallback(() => {
    const uSV = storage.watch('session:storageVersion', async newValue => {
      setStorageVersion(newValue);
    });

    return uSV;
  }, []);

  const fetchInitialData = useCallback(async () => {
    const [domainData, fetchedItems, fetchedTags] = await Promise.all([
      getDomainFromTab(),
      getItems(),
      getTags()
    ]);

    const sanitizedDomain = filterXSS(domainData.domain);
    const sanitizedUrl = filterXSS(domainData.url);

    setDomain(sanitizedDomain);
    setUrl(sanitizedUrl);
    setItems(fetchedItems);

    return { url: sanitizedUrl, items: fetchedItems, tags: fetchedTags };
  }, []);

  const getTagsAmount = useCallback(async (tags, services) => {
    if (!Array.isArray(tags) || tags.length === 0) {
      setTags([]);
      return false;
    }

    const tagMap = new Map(tags.map((tag, index) => [tag.id, index]));
    const servicesWithTags = services.filter(service => service?.tags && Array.isArray(service?.tags) && service?.tags?.length > 0);

    for (const service of servicesWithTags) {
      for (const tagId of service.tags) {
        const tagIndex = tagMap.get(tagId);

        if (tagIndex === undefined) {
          await CatchError(new TwoFasError(TwoFasError.internalErrors.tagIndexError, { additional: { tagId } }));
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

  const messageListener = useCallback((request, sender, sendResponse) => onMessage(request, sender, sendResponse, sendUrl), [sendUrl]);

  const playEmptyStateAnimation = useCallback(() => {
    setTimeout(() => {
      if (boxAnimationRef?.current?.play) {
        boxAnimationRef.current.play();
      }

      if (boxAnimationDarkRef?.current?.play) {
        boxAnimationDarkRef.current.play();
      }
    }, 600);
  }, []);

  const initializeData = useCallback(async () => {
    try {
      const { url, items: fetchedItems, tags: fetchedTags } = await fetchInitialData();

      await Promise.all([
        getMatchingLogins(fetchedItems, url),
        getTagsAmount(fetchedTags, fetchedItems)
      ]);

      if (fetchedItems.length === 0) {
        playEmptyStateAnimation();
      }

      unwatchStorageVersion.current = watchStorageVersion();
    } catch (e) {
      await CatchError(e);
    }
  }, [fetchInitialData, getMatchingLogins, getTagsAmount, playEmptyStateAnimation, watchStorageVersion]);

  const handleAnimationComplete = useCallback(e => {
    if (e === 'visible') {
      thisTabTopRef.current.style.overflow = 'visible';
    } else if (e === 'hidden') {
      thisTabTopRef.current.style.overflow = 'clip';
    }
  }, []);

  const handleAnimationUpdate = useCallback(() => {
    if (data?.searchActive || data?.selectedTag) {
      scrollableRef.current.scrollTo(0, 0);
    }
  }, [data?.searchActive, data?.selectedTag]);

  const hasMatchingLogins = useMemo(() => isItemsCorrect(matchingLogins) && matchingLogins?.length > 0, [matchingLogins]);
  const hasLogins = useMemo(() => isItemsCorrect(items) && items?.length > 0, [items]);

  const filteredItemsData = useMemo(() => {
    let filteredByModel = items;

    if (data?.itemModelFilter) {
      filteredByModel = items.filter(item => item?.constructor?.name === data.itemModelFilter);
    }

    const servicesWithTags = filteredByModel.filter(service => service?.tags && Array.isArray(service?.tags) && service?.tags?.length > 0);

    const tagAmountMap = new Map();

    for (const service of servicesWithTags) {
      for (const tagId of service.tags) {
        tagAmountMap.set(tagId, (tagAmountMap.get(tagId) || 0) + 1);
      }
    }

    const tagsWithAmounts = Array.isArray(tags) && tags.length > 0
      ? tags.map(tag => ({ ...tag, amount: tagAmountMap.get(tag.id) || 0 }))
      : [];

    let filteredByTag = filteredByModel;

    if (data?.selectedTag) {
      const selectedTagId = data.selectedTag.id;
      filteredByTag = filteredByModel.filter(item => {
        if (!item?.tags || !Array.isArray(item?.tags)) {
          return false;
        }

        return item.tags.includes(selectedTagId);
      });
    }

    let filteredBySearch = filteredByTag;

    if (data?.searchValue && data.searchValue.length > 0) {
      const searchLower = data.searchValue.toLowerCase();
      filteredBySearch = filteredByTag.filter(item => {
        let urisTexts = [];

        if (item?.content && item?.content?.uris && Array.isArray(item?.content?.uris)) {
          urisTexts = item.content.uris.map(uri => uri?.text).filter(Boolean);
        }

        return item?.content?.name?.toLowerCase().includes(searchLower) ||
          item?.content?.username?.toLowerCase().includes(searchLower) ||
          urisTexts.some(uriText => uriText?.toLowerCase().includes(searchLower));
      });
    }

    return {
      filteredByModel,
      tagsWithAmounts,
      filteredByTag,
      filteredBySearch,
      filteredCount: filteredBySearch.length
    };
  }, [items, tags, data?.itemModelFilter, data?.selectedTag, data?.searchValue]);

  const filteredItemsByModel = filteredItemsData.filteredByModel;
  const tagsWithFilteredAmounts = filteredItemsData.tagsWithAmounts;

  const matchingLoginsListClass = `${S.thisTabMatchingLoginsList} ${hasMatchingLogins || loading ? S.active : ''}`;
  const allLoginsClass = `${S.thisTabAllLogins} ${!hasLogins && !loading ? S.hidden : ''}`;

  const filteredItemsCount = filteredItemsData.filteredCount;

  useEffect(() => {
    browser.runtime.onMessage.addListener(messageListener);
    initializeData();

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);

      if (unwatchStorageVersion.current) {
        unwatchStorageVersion.current();
      }
    };
  }, [storageVersion, messageListener, initializeData]);

  useEffect(() => {
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
            <KeepPassword />

            <div className={S.thisTabContainer}>
              <m.div
                ref={thisTabTopRef}
                className={S.thisTabTop}
                variants={thisTabTopVariants}
                initial="visible"
                animate={data?.searchActive || data?.selectedTag ? 'hidden' : 'visible'}
                onAnimationComplete={handleAnimationComplete}
                onUpdate={handleAnimationUpdate}
              >
                <UpdateComponent />

                <div className={S.thisTabHeader}>
                  <h1>
                    {loading ? '\u00A0' : (hasMatchingLogins ? browser.i18n.getMessage('this_tab_matching_logins_header') : browser.i18n.getMessage('this_tab_matching_logins_header_no_logins'))}
                  </h1>
                  <h2 className={loading ? '' : S.loaded} title={url}>
                    <DomainIcon />
                    <span>{domain}</span>
                  </h2>
                </div>

                <div className={S.thisTabMatchingLogins}>
                  <div className={matchingLoginsListClass}>
                    <ItemListProvider>
                      <MatchingItemsList
                        items={matchingLogins}
                        loading={loading}
                      />
                    </ItemListProvider>
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
                <ModelFilter loading={loading} />

                <div className={S.thisTabAllLoginsSearchContainer}>
                  <Search
                    tagsWithFilteredAmounts={tagsWithFilteredAmounts}
                    filteredItemsByModelLength={filteredItemsByModel?.length}
                  />
                  <Filters
                    tags={tagsWithFilteredAmounts}
                    selectedTag={data.selectedTag}
                    onTagChange={handleTagChange}
                  />
                  <Sort
                    selectedSort={data.selectedSort || 'az'}
                    onSortChange={handleSortChange}
                  />
                </div>

                <TagsInfo
                  tagsWithFilteredAmounts={tagsWithFilteredAmounts}
                  filteredItemsCount={filteredItemsCount}
                />

                <ItemListProvider>
                  <AllItemsList
                    items={items}
                    sort={data.selectedSort}
                    search={data?.searchValue}
                    loading={loading}
                    selectedTag={data?.selectedTag}
                    itemModelFilter={data?.itemModelFilter}
                  />
                </ItemListProvider>
              </div>
            </div>
          </section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default memo(ThisTab);
