// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Details.module.scss';
import { LazyMotion } from 'motion/react';
import { useParams, useNavigate, useLocation, Link } from 'react-router';
import { useState, useEffect, useCallback, useRef, useMemo, lazy } from 'react';
import getItem from '@/partials/sessionStorage/getItem';
import usePopupStateStore from '../../store/popupState';
import useScrollPosition from '../../hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import Login from '@/partials/models/Login';
import { PULL_REQUEST_TYPES } from '@/constants';

// Model Views
import LoginDetailsView from './modelsViews/LoginDetailsView';
import SecureNoteDetailsView from './modelsViews/SecureNoteDetailsView';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const ServiceFetchIcon = lazy(() => import('@/assets/popup-window/service-fetch.svg?react'));

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
  const scrollableRef = useRef(null);

  const data = usePopupStateStore(state => state.data);
  const popupHref = usePopupStateStore(state => state.popupHref);
  const setData = usePopupStateStore(state => state.setData);

  const getData = useCallback(async () => {
    try {
      let item;

      // @TODO Fix Here!
      if (location.state?.data) {
        item = new Login(location.state.data.item);
      } else if (data?.item) {
        item = new Login(data.item);
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
  }, [getData]);

  const constructorName = useMemo(() => {
    if (loading) {
      return null;
    }

    return data?.item?.constructor?.name;
  }, [loading, data?.item]);

  const modelComponent = useMemo(() => {
    if (loading) {
      return null;
    }

    const modelData = {};

    if (constructorName === 'Login') {
      return <LoginDetailsView {...props} {...modelData} />;
    }

    if (constructorName === 'SecureNote') {
      return <SecureNoteDetailsView {...props} {...modelData} />;
    }

    return null;
  }, [loading, constructorName, props]);

  useScrollPosition(scrollableRef, loading);

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
              <h2>{constructorName} {browser.i18n.getMessage('details_header')}</h2>

              <div className={`${S.detailsFetch} ${data?.item?.securityType === SECURITY_TIER.HIGHLY_SECRET && !data?.item?.sifExists ? '' : S.hidden}`}>
                <p>{browser.i18n.getMessage('details_fetch_text')}</p>
                <Link
                  to='/fetch'
                  state={{
                    action: PULL_REQUEST_TYPES.SIF_REQUEST,
                    from: 'details',
                    data: {
                      itemId: data.item.id,
                      deviceId: data.item.deviceId,
                      vaultId: data.item.vaultId,
                      contentType: data.item.constructor.contentType
                    }
                  }}
                  title={browser.i18n.getMessage('details_fetch_title')}
                >
                  <ServiceFetchIcon />
                  <span>{browser.i18n.getMessage('fetch')}</span>
                </Link>
              </div>

              {modelComponent}
            </div>
          </section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default Details;
