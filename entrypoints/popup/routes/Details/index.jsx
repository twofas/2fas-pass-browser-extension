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
import matchModel from '@/partials/models/itemModels/matchModel';
import { PULL_REQUEST_TYPES } from '@/constants';

// Model Views
import LoginDetailsView from './modelsViews/LoginDetailsView';
import SecureNoteDetailsView from './modelsViews/SecureNoteDetailsView';
import PaymentCardDetailsView from './modelsViews/PaymentCardDetailsView';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
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

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);
  const setScrollPosition = usePopupStateStore(state => state.setScrollPosition);

  const getData = useCallback(async originalItem => {
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
            delete stateContent.s_text;
            delete stateContent.s_password;

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

      const hasEditedSifFromState = location.state?.data?.editedSif !== undefined;
      const hasEditedPaymentCardSifFromState = location.state?.data?.editedCardNumber !== undefined
        || location.state?.data?.editedExpirationDate !== undefined
        || location.state?.data?.editedSecurityCode !== undefined;

      if (item.sifExists && !item.isSifDecrypted && !item.internalData?.editedSif && !hasEditedSifFromState && !hasEditedPaymentCardSifFromState) {
        try {
          const decryptedData = await item.decryptSif();

          if (item.constructor.name === 'Login') {
            item.setSifDecrypted(decryptedData.password);
          } else if (item.constructor.name === 'SecureNote') {
            item.setSifDecrypted(decryptedData.text);
          } else if (item.constructor.name === 'PaymentCard') {
            item.setSifDecrypted(decryptedData);
          }

          setData('sifDecryptError', false);
        } catch (e) {
          setData('sifDecryptError', true);
          CatchError(e);
        }
      }

      if (editedSecurityType !== undefined && item.securityType !== editedSecurityType) {
        item.securityType = editedSecurityType;
      }

      if (location.state?.scrollPosition !== undefined) {
        setData('thisTabScrollPosition', location.state.scrollPosition);
      }

      if (location.state?.data) {
        const stateData = location.state.data;

        Object.keys(stateData).forEach(field => {
          if (field !== 'item' && field !== 'editedSif') {
            setData(field, stateData[field]);
          }
        });

        if (stateData.editedSif !== undefined && item) {
          if (item.constructor.name === 'Login') {
            item.setSifDecrypted(stateData.editedSif);
            item.internalData.editedSif = stateData.editedSif;
          } else if (item.constructor.name === 'SecureNote') {
            item.setSifDecrypted(stateData.editedSif);
            item.internalData.editedSif = stateData.editedSif;
          }

          setData('sifDecryptError', false);
        }

        if (stateData.domainsEditable && item && item.internalData?.urisWithTempIds) {
          const newDomainsEditable = {};
          item.internalData.urisWithTempIds.forEach((uri) => {
            newDomainsEditable[uri._tempId] = true;
          });
          setData('domainsEditable', newDomainsEditable);
        }

        if (!location.state?.generatedPassword) {
          if (stateData.passwordEditable !== undefined) {
            setData('passwordEditable', stateData.passwordEditable);
          }

          if (stateData.passwordEdited !== undefined) {
            setData('passwordEdited', stateData.passwordEdited);
          }
        }
      }

      if (location.state?.generatedPassword) {
        item.internalData.editedSif = location.state.generatedPassword;
        setData('passwordEditable', true);
        setData('passwordEdited', true);
      }

      if (!location.state?.data && item && item.internalData?.urisWithTempIds && item.internalData.urisWithTempIds.length > 0) {
        const currentDomainsEditable = data.domainsEditable || {};
        const hasEditableDomains = Object.keys(currentDomainsEditable).length > 0;

        if (hasEditableDomains) {
          const newDomainsEditable = {};
          item.internalData.urisWithTempIds.forEach((uri) => {
            newDomainsEditable[uri._tempId] = true;
          });
          setData('domainsEditable', newDomainsEditable);
        }
      }

      setData('item', item);
      setLoading(false);
    } catch (e) {
      CatchError(e);
      navigate('/');
    }
  }, [params.deviceId, params.vaultId, params.id, navigate, setData, setScrollPosition, location.state]);

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
    getOriginalItem().then(getData);
  }, [getData, getOriginalItem]);

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
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div ref={scrollableRef}>
          <section className={S.details}>
            <div className={S.detailsContainer}>
              <NavigationButton
                type='cancel'
                state={{
                  from: 'details',
                  data: {
                    lastSelectedTagInfo: data?.lastSelectedTagInfo,
                    searchActive: data?.searchActive,
                    searchValue: data?.searchValue,
                    selectedTag: data?.selectedTag
                  },
                  scrollPosition: data?.thisTabScrollPosition
                }}
              />
              <h2>{originalItem?.internalData?.uiName} {browser.i18n.getMessage('details_header')}</h2>

              <div className={`${S.detailsFetch} ${originalItem?.securityType === SECURITY_TIER.HIGHLY_SECRET && !originalItem?.sifExists ? '' : S.hidden}`}>
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
