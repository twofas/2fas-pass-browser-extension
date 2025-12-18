// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Details.module.scss';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useState, useEffect, useCallback, useRef, useMemo, lazy } from 'react';
import getItem from '@/partials/sessionStorage/getItem';
import usePopupState from '../../store/popupState/usePopupState';
import useScrollPosition from '../../hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import { matchModel, Login } from '@/models/itemModels';
import { PULL_REQUEST_TYPES } from '@/constants';
import ClearLink from '../../components/ClearLink';

// Model Views
import LoginDetailsView from './modelsViews/LoginDetailsView';
import SecureNoteDetailsView from './modelsViews/SecureNoteDetailsView';
import PaymentCardDetailsView from './modelsViews/PaymentCardDetailsView';

console.log('🎭 [PERF] Details: NO motion wrapper needed at:', performance.now().toFixed(2), 'ms');
const ServiceFetchIcon = lazy(() => import('@/assets/popup-window/service-fetch.svg?react'));

const DetailsViews = {
  'Login': LoginDetailsView,
  'SecureNote': SecureNoteDetailsView,
  'PaymentCard': PaymentCardDetailsView
};

/**
* Function to render the details component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Details(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [originalItem, setOriginalItem] = useState(null);
  const scrollableRef = useRef(null);

  const { data, setData, setBatchData, setScrollPosition } = usePopupState();

  const fetchItemData = useCallback(async originalItem => {
    try {
      if (location.state?.from === 'thisTab') {
        setScrollPosition(0);
      }

      let item;
      let editedSecurityType;

      if (location.state?.data?.item) {
        editedSecurityType = location.state.data.item.securityType;

        if (location.state?.from === 'fetch' && originalItem) {
          const originalItemData = originalItem.toJSON();
          const mergedItem = { ...originalItemData };

          if (location.state.data.item.content) {
            const stateContent = { ...location.state.data.item.content };

            mergedItem.content = { ...originalItemData.content, ...stateContent };
          }

          if (location.state.data.item.tags !== undefined) {
            mergedItem.tags = location.state.data.item.tags;
          }

          delete mergedItem.internalData;

          item = await matchModel(mergedItem);
        } else {
          item = await matchModel({ ...location.state.data.item, securityType: originalItem?.securityType });
        }
      } else if (data?.item) {
        if (location.state?.from !== 'thisTab') {
          try {
            editedSecurityType = data.item.securityType;
            item = await matchModel({ ...data.item, securityType: originalItem?.securityType });
          } catch {
            if (params.id) {
              item = await getItem(params.deviceId, params.vaultId, params.id);
            }
          }
        } else {
          if (params.id) {
            item = await getItem(params.deviceId, params.vaultId, params.id);
          }
        }
      } else if (params.id) {
        item = await getItem(params.deviceId, params.vaultId, params.id);
      }

      if (!item) {
        showToast(browser.i18n.getMessage('details_item_not_found'), 'error');
        navigate('/');
        return;
      }

      if (editedSecurityType !== undefined && item.securityType !== editedSecurityType) {
        item.securityType = editedSecurityType;
      }

      if (location.state?.data) {
        const stateData = location.state.data;

        Object.keys(stateData).forEach(field => {
          if (field !== 'item') {
            setData(field, stateData[field]);
          }
        });

        if (!location.state?.generatedPassword) {
          if (stateData.passwordEditable !== undefined) {
            setData('passwordEditable', stateData.passwordEditable);
          }
        }
      }

      if (location.state?.generatedPassword && item instanceof Login) {
        const itemData = item.toJSON();
        const updatedItem = new Login(itemData);
        await updatedItem.setSif([{ s_password: location.state.generatedPassword }]);
        item = updatedItem;

        setBatchData({
          passwordEditable: true,
          passwordVisible: location.state?.data?.passwordVisible || false
        });
      }

      setData('item', item);
      setLoading(false);
    } catch (e) {
      CatchError(e);
      navigate('/');
    }
  }, [params.deviceId, params.vaultId, params.id, navigate, setData, setBatchData, setScrollPosition, location.state]);

  const getOriginalItem = useCallback(async () => {
    try {
      const originalItemData = await getItem(params.deviceId, params.vaultId, params.id);
      setOriginalItem(originalItemData);
      return originalItemData;
    } catch (e) {
      CatchError(e);
      setOriginalItem(null);
      return null;
    }
  }, [params.deviceId, params.vaultId, params.id]);

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

    const modelData = {
      originalItem
    };

    if (DetailsViews[constructorName]) {
      const ModelViewComponent = DetailsViews[constructorName];
      return <ModelViewComponent {...props} {...modelData} />;
    }

    return null;
  }, [loading, constructorName, props, originalItem]);

  useEffect(() => {
    getOriginalItem().then(fetchItemData);
  }, [fetchItemData, getOriginalItem]);

  useEffect(() => {
    if (!loading && constructorName && !DetailsViews[constructorName]) {
      showToast(browser.i18n.getMessage('details_item_not_found'), 'error');
      navigate('/');
    }
  }, [loading, constructorName, navigate]);

  useScrollPosition(scrollableRef, loading);

  if (loading || !modelComponent) {
    return null;
  }

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.details}>
          <div className={S.detailsContainer}>
            <NavigationButton type='back' />
            <h2>{originalItem?.internalData?.uiName} {browser.i18n.getMessage('details_header')}</h2>

            <div className={`${S.detailsFetch} ${originalItem?.securityType === SECURITY_TIER.HIGHLY_SECRET && !originalItem?.sifExists ? '' : S.hidden}`}>
              <p>{browser.i18n.getMessage('details_fetch_text')}</p>
              <ClearLink
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
              </ClearLink>
            </div>

            {modelComponent}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Details;
