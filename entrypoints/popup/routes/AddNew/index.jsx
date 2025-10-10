// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './AddNew.module.scss';
import { LazyMotion } from 'motion/react';
import { useRef } from 'react';
import { useParams } from 'react-router';
import usePopupStateStore from '../../store/popupState';
import useScrollPosition from '../../hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';

// Model Views
import LoginView from './modelsViews/LoginAddNewView';
import SecureNoteView from './modelsViews/SecureNoteAddNewView';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

/**
* AddNew component for creating a new item entry.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered component.
*/
function AddNew (props) {
  const params = useParams();
  const scrollableRef = useRef(null);
  const data = usePopupStateStore(state => state.data);

  useScrollPosition(scrollableRef, true);

  const modelComponent = useMemo(() => {
    const modelName = params.model;

    const modelData = {};

    if (modelName === 'Login') {
      return <LoginView {...props} {...modelData} />;
    }

    if (modelName === 'SecureNote') {
      return <SecureNoteView {...props} {...modelData} />;
    }

    return null;
  }, [data?.item, props]);

  if (!modelComponent) {
    return null;
  }

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div ref={scrollableRef}>
          <section className={S.addNew}>
            <div className={S.addNewContainer}>
              <NavigationButton type='cancel' />
              
              <h2>{browser.i18n.getMessage('add_new_header')}</h2>
              <h3>{browser.i18n.getMessage('add_new_subheader')}</h3>

              {modelComponent}
            </div>
          </section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default AddNew;