// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState } from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { DEFAULT_PREFERENCES, Preferences,CARD_CONFIG,CARD_DEFINITIONS} from './cards-config';
import { Flashbar, Pagination,   Cards, TextFilter } from '@cloudscape-design/components';
import { CardPageHeader } from '../prompt_hub/common-components';
import {
  CustomAppLayout,
  Navigation,
  TableNoMatchState,
  TableEmptyState,
} from '../commons/common-components';
import { paginationLabels,distributionSelectionLabels } from '../../common/labels';
import { getFilterCounterText } from '../../common/tableCounterStrings';
import { useLocalStorage } from '../../common/localStorage';
import {useSimpleNotifications} from '../commons/use-notifications';
import {useAuthUserInfo, useAuthorizedHeader} from "../commons/use-auth";
import {getPrompts} from '../commons/api-gateway';
import { useTranslation } from 'react-i18next';
import {params_local_storage_key,CardBreadcrumbs} from "../prompt_hub/common-components";
import ModelSettings from "../commons/chat-settings";



function CardsContent({ 
  resourceName,
  distributions,
  loadingState,
  refreshAction,
  buttonName,
  buttonHref,
 }) {
  const [preferences, setPreferences] = useLocalStorage('PE-Hub-Table-Preferences', DEFAULT_PREFERENCES);
  // const [columnDefinitions, saveWidths] = useColumnWidths('PE-Hub-Table-Widths', COLUMN_DEFINITIONS);
  const {t} = useTranslation();

  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    distributions,
    {
      filtering: {
        empty: <TableEmptyState resourceName={resourceName} />,
        noMatch: <TableNoMatchState onClearFilter={() => actions.setFiltering('')} />,
      },
      pagination: { pageSize: preferences.pageSize },
      // sorting: {defaultState: {sortingDescending:true, sortingColumn: columnDefinitions[5], isDescending:true }},
      selection: {},
    }
  );

  return (
    <div>
        <ModelSettings href={'/prompt_playground'}/>
    <Cards
     {...collectionProps}
     cardDefinition={CARD_DEFINITIONS}
     visibleColumns={preferences.visibleContent}
      cardsPerRow={CARD_CONFIG}
      entireCardClickable
      items={items}
      selectionType="single"
      loading = {loadingState}
      loadingText = {t("loading")}
      ariaLabels={distributionSelectionLabels}
      variant="full-page"
      // onColumnWidthsChange={saveWidths}
      wrapLines={preferences.wrapLines}
      filter={
        <TextFilter
          {...filterProps}
          filteringAriaLabel="Filter "
          filteringPlaceholder="Find "
          countText={getFilterCounterText(filteredItemsCount)}
        />
      }
      header={
        <CardPageHeader
          selectedItems={collectionProps.selectedItems}
          totalItems={distributions}
          resourceName={resourceName}
          refreshAction={refreshAction}
          href={buttonHref}
        />
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
      preferences={<Preferences preferences={preferences} setPreferences={setPreferences} />}
    />
</div>
  );
}


export default function PEPlayCard () {
  const appLayout = useRef();
  const {notificationitems} = useSimpleNotifications();
  const [toolsOpen, setToolsOpen] = useState(false);
  const {t} = useTranslation();
  const headers = useAuthorizedHeader();
  const [loadingState, setLoadingState] = useState(true);
  const [docitems,setDocsItems] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const refreshAction =()=>{
    setRefresh(v => !v);
  };
  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const company = userinfo?.company || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+username,
    null
  );
  const main_fun_arn = localStoredParams?.main_fun_arn;
  const apigateway_endpoint = localStoredParams?.apigateway_endpoint;
  const queryParams = {
    main_fun_arn:main_fun_arn,
    apigateway_endpoint:apigateway_endpoint,
    company:company,
    is_recommended:true,
  }
  useEffect(()=>{
    setLoadingState(true);
    getPrompts(headers,queryParams)
    .then(data =>{
      // console.log(data);
      const items = data.map( it =>(it))
      setDocsItems(items);
        setLoadingState(false);
    })
    .catch(err =>{
      setDocsItems([]);
        setLoadingState(false);
        console.log(JSON.stringify(err))
    }
    )
},[refresh]);

  return (

    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref={'/prompt_playground'} />}
      notifications={<Flashbar items={notificationitems} stackItems/>}
      breadcrumbs={<CardBreadcrumbs />}
      content={<CardsContent 
                resourceName={t('demo_hub')}
                distributions = {docitems}
                loadingState={loadingState}
                refreshAction={refreshAction}
            />}
      contentType="table"
      stickyNotifications
      onToolsChange={({ detail }) => setToolsOpen(detail.open)}
    />

  );
}
