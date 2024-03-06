// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState } from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { CARD_DEFINITIONS, CARD_CONFIG,VISIBLE_CONTENT_OPTIONS, PAGE_SIZE_OPTIONS, DEFAULT_PREFERENCES,Preferences } from './cards-config';
import { Flashbar, Pagination, Table, TextFilter,Cards } from '@cloudscape-design/components';
import { FullPageHeader ,Breadcrumbs,DeleteConfirmModal} from './common-components';
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
import ModelSettings from "../commons/chat-settings";


function CardsContent({
  resourceName,
  distributions,
  loadingState,
  refreshAction,
  buttonName,
  buttonHref,
}){

  const [preferences, setPreferences] = useLocalStorage('Chatbot-Cards-Preferences', DEFAULT_PREFERENCES);
//   const [columnDefinitions, saveWidths] = useColumnWidths('Benchportal-React-Table-Widths', COLUMN_DEFINITIONS);
  const {t} = useTranslation();

  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    distributions,
    {
      filtering: {
        empty: <TableEmptyState resourceName={resourceName} />,
        noMatch: <TableNoMatchState onClearFilter={() => actions.setFiltering('')} />,
      },
      pagination: { pageSize: preferences.pageSize },
      selection: {},
    }
  );

  return (
    <div>
        <ModelSettings href={'/prompt_hub'}/>
    <Cards
     {...collectionProps}
      stickyHeader={true}
      cardDefinition={CARD_DEFINITIONS}
      visibleSections={preferences.visibleContent}
      cardsPerRow={CARD_CONFIG}
      entireCardClickable
      items={items}
      selectionType="single"
      loading = {loadingState}
      loadingText = {t("loading")}
      ariaLabels={distributionSelectionLabels}
      variant="full-page"
      filter={
        <TextFilter
          {...filterProps}
          filteringAriaLabel="Filter "
          filteringPlaceholder="Find "
          countText={getFilterCounterText(filteredItemsCount)}
        />
      }
      header={
        <FullPageHeader
          selectedItems={collectionProps.selectedItems}
          totalItems={distributions}
          resourceName={resourceName}
          createButtonText={buttonName}
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

export default function PromptHubCards () {
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
  const queryParams = {

    company:company
  }
  useEffect(()=>{
    setLoadingState(true);
    getPrompts(headers,queryParams)
    .then(data =>{
      console.log(data);
      const items = data.map( it =>({template_name:it.template_name,
        description:it.description,
        id:it.id,
        username:it.username,
        prompt_category:it.prompt_category
      }))
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
      navigation={<Navigation activeHref={'/prompt_hub'} />}
      notifications={<Flashbar items={notificationitems} stackItems/>}
      breadcrumbs={<Breadcrumbs />}
      content={<CardsContent 
                resourceName={t('prompt_template')}
                distributions = {docitems}
                loadingState={loadingState}
                refreshAction={refreshAction}
            />}
      contentType="table"
      stickyNotifications
      // tools={<ToolsContent />}
      // toolsOpen={toolsOpen}
      onToolsChange={({ detail }) => setToolsOpen(detail.open)}
    />

  );
}
