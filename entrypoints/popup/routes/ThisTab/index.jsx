// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ThisTab.module.scss';
import { motion } from 'motion/react';
import { useEffect, useState, useRef, useCallback, useMemo, memo, useContext } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import { ScrollableRefContext } from '../../context/ScrollableRefProvider';
import getDomainFromTab from './functions/getDomainFromTab';
import onMessage from './events/onMessage';
import URIMatcher from '@/partials/URIMatcher';
import getItems from '@/partials/sessionStorage/getItems';
import { filterXSS } from 'xss';
import sanitizeObject from '@/partials/functions/sanitizeObject';
import getDomainFromMessage from './functions/getDomainFromMessage';
import isItemsCorrect from './functions/isItemsCorrect';
import usePopupState from '../../store/popupState/usePopupState';
import useScrollPosition from '../../hooks/useScrollPosition';
import { useTagFilter } from './components/Filters/hooks/useTagFilter';
import { useSortFilter } from './components/Sort/hooks/useSortFilter';
import useTags from '../../hooks/useTags';
import DomainIcon from '@/assets/popup-window/domain.svg?react';
import { AllItemsList, Filters, KeepItem, MatchingItemsList, ModelFilter, NoMatch, Search, Sort, TagsInfo, UpdateComponent } from './components';
import { ItemListProvider } from './context/ItemListContext';

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
  const { getMessage } = useI18n();
  const scrollableRefContext = useContext(ScrollableRefContext);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('Unknown');
  const [url, setUrl] = useState('Unknown');
  const [items, setItems] = useState([]);
  const [matchingLogins, setMatchingLogins] = useState([]);
  const [storageVersion, setStorageVersion] = useState(null);

  const { data, setBatchData } = usePopupState();
  const { tags, fetchTags, validateTagsInItems } = useTags({ autoFetch: false });

  useAutofillFailedCheck();

  // Refs
  const scrollableRef = useRef(null);
  const unwatchStorageVersion = useRef(null);
  const thisTabTopRef = useRef(null);

  useScrollPosition(scrollableRef, loading);

  useEffect(() => {
    if (scrollableRefContext?.setRef && scrollableRef.current) {
      scrollableRefContext.setRef(scrollableRef.current);
    }
  }, [scrollableRefContext]);

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

    setBatchData({ searchActive: false, searchValue: '' });
  }, [setBatchData]);

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
      fetchTags()
    ]);

    const sanitizedDomain = filterXSS(domainData.domain);
    const sanitizedUrl = filterXSS(domainData.url);

    setDomain(sanitizedDomain);
    setUrl(sanitizedUrl);
    setItems(fetchedItems);

    return { url: sanitizedUrl, items: fetchedItems, tags: fetchedTags };
  }, [fetchTags]);

  const getMatchingLogins = useCallback(async (logins, domain) => {
    let matchingLogins = [];

    try {
      matchingLogins = URIMatcher.getMatchedAccounts(logins, domain);
    } catch {}

    setMatchingLogins(sanitizeObject(matchingLogins));
    setLoading(false);
  }, []);

  const messageListener = useCallback((request, sender, sendResponse) => onMessage(request, sender, sendResponse, sendUrl), [sendUrl]);

  const handleAnimationReady = useCallback((lightRef, darkRef) => {
    if (lightRef?.current?.play) {
      lightRef.current.play();
    }

    if (darkRef?.current?.play) {
      darkRef.current.play();
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const { url, items: fetchedItems, tags: fetchedTags } = await fetchInitialData();

      await Promise.all([
        getMatchingLogins(fetchedItems, url),
        validateTagsInItems(fetchedTags, fetchedItems)
      ]);
    } catch (e) {
      await CatchError(e);
    }
  }, [fetchInitialData, getMatchingLogins, validateTagsInItems]);

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
    unwatchStorageVersion.current = watchStorageVersion();

    return () => {
      if (unwatchStorageVersion.current) {
        unwatchStorageVersion.current();
      }
    };
  }, [watchStorageVersion]);

  useEffect(() => {
    browser.runtime.onMessage.addListener(messageListener);
    refreshData();

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, [storageVersion, messageListener, refreshData]);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.thisTab}>
          <KeepItem />

          <div className={S.thisTabContainer}>
            <motion.div
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
                    {loading ? '\u00A0' : (hasMatchingLogins ? getMessage('this_tab_matching_logins_header') : getMessage('this_tab_matching_logins_header_no_logins'))}
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
                    onAnimationReady={handleAnimationReady}
                  />
                </div>
              </motion.div>

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
  );
}

export default memo(ThisTab);
