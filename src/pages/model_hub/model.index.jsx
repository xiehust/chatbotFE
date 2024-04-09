// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState } from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { COLUMN_DEFINITIONS, DEFAULT_PREFERENCES, Preferences,} from './table-config';
import { Flashbar, Pagination, Table, TextFilter } from '@cloudscape-design/components';
import { FullPageHeader ,Breadcrumbs,DeleteConfirmModal} from './common-components';
import {
  CustomAppLayout,
  Navigation,
  TableNoMatchState,
  TableEmptyState,
  ToolsContent,
} from '../commons/common-components';
import { paginationLabels,distributionSelectionLabels } from '../../common/labels';
import { getFilterCounterText } from '../../common/tableCounterStrings';
import { useColumnWidths } from '../commons/use-column-widths';
import { useLocalStorage } from '../../common/localStorage';
import {useSimpleNotifications} from '../commons/use-notifications';
import {useAuthUserInfo, useAuthorizedHeader} from "../commons/use-auth";
import {getModelCards} from '../commons/api-gateway';
import { useTranslation } from 'react-i18next';
import {params_local_storage_key} from "../chatbot/common-components";
// import ModelSettings from "../commons/chat-settings";
import CreateQAModal from '../feedback/addfeedback';




function TableContent({ 
  resourceName,
  distributions,
  loadingState,
  refreshAction,
  buttonName,
  buttonHref,
 }) {
  const [preferences, setPreferences] = useLocalStorage('Model_hub-Docs-Table-Preferences', DEFAULT_PREFERENCES);
  const [columnDefinitions, saveWidths] = useColumnWidths('Model_hub-Docs-Table-Widths', COLUMN_DEFINITIONS);
  const {t} = useTranslation();
  const [qAModalVisible,setQAModalVisible] = useState(false);


  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    distributions,
    {
      filtering: {
        empty: <TableEmptyState resourceName={resourceName} />,
        noMatch: <TableNoMatchState onClearFilter={() => actions.setFiltering('')} />,
      },
      pagination: { pageSize: preferences.pageSize },
      sorting: {defaultState: {sortingDescending:true, sortingColumn: columnDefinitions[12], isDescending:true }},
      selection: {},
    }
  );

  function handleAddClick(event){
    event.preventDefault();
    setQAModalVisible(true);
  }

  return (
    <div>
     <CreateQAModal visible={qAModalVisible} setVisible={setQAModalVisible} />

    <Table
     {...collectionProps}
      columnDefinitions={columnDefinitions}
      visibleColumns={preferences.visibleContent}
      items={items}
      selectionType="single"
      loading = {loadingState}
      loadingText = {t("loading")}
      ariaLabels={distributionSelectionLabels}
      variant="full-page"
      stickyHeader={true}
      resizableColumns={true}
      onColumnWidthsChange={saveWidths}
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
        <FullPageHeader
          selectedItems={collectionProps.selectedItems}
          totalItems={distributions}
          resourceName={resourceName}
          createButtonText={buttonName}
          refreshAction={refreshAction}
          handleAddClick={handleAddClick}

          href={buttonHref}
        />
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
      preferences={<Preferences preferences={preferences} setPreferences={setPreferences} />}
    />
</div>
  );
}

export default function ModelHubTable () {
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
    company:company
  }
  useEffect(()=>{
    setLoadingState(true);
    getModelCards(headers,queryParams)
    .then(data =>{
      console.log(data);
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
      navigation={<Navigation activeHref={'/model_hub'} />}
      notifications={<Flashbar items={notificationitems} stackItems/>}
      breadcrumbs={<Breadcrumbs />}
      content={<TableContent 
                resourceName={t('model_hub')}
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