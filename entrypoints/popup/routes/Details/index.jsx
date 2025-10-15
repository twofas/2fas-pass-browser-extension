// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Details.module.scss';
import { LazyMotion } from 'motion/react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import getItem from '@/partials/sessionStorage/getItem';
import usePopupStateStore from '../../store/popupState';
import useScrollPosition from '../../hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import Login from '@/partials/models/Login';

// Model Views
import LoginView from './modelsViews/LoginDetailsView';
import SecureNoteView from './modelsViews/SecureNoteDetailsView';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

/** 
* Function to render the details component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Details (props) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [storageVersion, setStorageVersion] = useState(null);

  const unwatchStorageVersion = useRef(null);
  const scrollableRef = useRef(null);

  const data = usePopupStateStore(state => state.data);
  const popupHref = usePopupStateStore(state => state.popupHref);
  const setData = usePopupStateStore(state => state.setData);

  useScrollPosition(scrollableRef, loading);

  const getData = useCallback(async () => {
    try {
      let item;

      // @TODO Fix Here!
      if (location.state?.data) {
        item = new Login(location.state.data.item, true);
      } else if (data?.item) {
        item = new Login(data.item, true);
      } else if (params.id) {
        item = await getItem(params.id);
      }

      if (!item) {
        showToast(browser.i18n.getMessage('details_item_not_found'), 'error');
        navigate('/');
        return;
      }

      setData('item', item);
      setLoading(false);
    } catch (e) {
      CatchError(e);
      navigate('/');
    }
  }, [params.id, navigate, setData, location.state, popupHref]);

  useEffect(() => {
    getData();

    unwatchStorageVersion.current = storage.watch('session:storageVersion', setStorageVersion);

    return () => {
      if (unwatchStorageVersion.current) {
        unwatchStorageVersion.current();
      }
    };
  }, [getData, storageVersion]);

  const modelComponent = useMemo(() => {
    if (loading) {
      return null;
    }

    const constructorName = data?.item?.constructor?.name;

    const modelData = {
      storageVersion
    };

    if (constructorName === 'Login') {
      return <LoginView {...props} {...modelData} />;
    }

    if (constructorName === 'SecureNote') {
      return <SecureNoteView {...props} {...modelData} />;
    }

    return null;
  }, [loading, data?.item, props]);

  if (loading || !modelComponent) {
    return null;
  }

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div ref={scrollableRef}>
          <section className={S.details}>
            <div className={S.detailsContainer}>
              <NavigationButton type='cancel' />
              <h2>{browser.i18n.getMessage('details_header')}</h2>
              {modelComponent}
            </div>
          </section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default Details;
