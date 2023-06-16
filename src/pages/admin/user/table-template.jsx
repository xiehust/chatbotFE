// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useRef, useState ,useContext} from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { COLUMN_DEFINITIONS, DEFAULT_PREFERENCES, Preferences } from './table-config';
import { Pagination, Table, TextFilter,Flashbar } from '@cloudscape-design/components';
import { FullPageHeader ,Breadcrumbs,ToolsContent} from './common-components';
import {
  CustomAppLayout,
  Navigation,
  TableEmptyState,
  TableNoMatchState,
} from '../../commons/common-components';
import { Notifications } from './common-components';
import { paginationLabels, distributionSelectionLabels } from '../../../common/labels';
import { getFilterCounterText } from '../../../common/tableCounterStrings';
import { useColumnWidths } from '../../commons/use-column-widths';
import { useLocalStorage } from '../../../common/localStorage';
import {useSimpleNotifications} from '../../commons/use-notifications';

export function TableContent({ 
  distributions,
  resourceName,
  buttonName,
  buttonHref,
  loadingState
 }) {
  const [columnDefinitions, saveWidths] = useColumnWidths('React-Table-Widths', COLUMN_DEFINITIONS);
  const [preferences, setPreferences] = useLocalStorage('React-'+resourceName+'-Preferences', DEFAULT_PREFERENCES);
  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    distributions,
    {
      filtering: {
        empty: <TableEmptyState resourceName={resourceName} />,
        noMatch: <TableNoMatchState onClearFilter={() => actions.setFiltering('')} />,
      },
      pagination: { pageSize: preferences.pageSize },
      sorting: { defaultState: { sortingColumn: columnDefinitions[0] } },
      selection: {},
    }
  );
  function handleAddClick(event){
    event.preventDefault();
  }
  return (
    <Table
      {...collectionProps}
      columnDefinitions={columnDefinitions}
      visibleColumns={preferences.visibleContent}
      items={items}
      selectionType="single"
      loading = {loadingState}
      loadingText = {"Loading"}
      ariaLabels={distributionSelectionLabels}
      variant="full-page"
      stickyHeader={true}
      resizableColumns={true}
      onColumnWidthsChange={saveWidths}
      wrapLines={preferences.wrapLines}
      header={
        <FullPageHeader
          selectedItems={collectionProps.selectedItems}
          totalItems={distributions}
          resourceName={resourceName}
          createButtonText={buttonName}
          handleAddClick={handleAddClick}
          href={buttonHref}
        />
      }
      filter={
        <TextFilter
          {...filterProps}
          filteringAriaLabel="Filter "
          filteringPlaceholder="Find "
          countText={getFilterCounterText(filteredItemsCount)}
        />
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
      preferences={<Preferences preferences={preferences} setPreferences={setPreferences} />}
    />
  );
}

export default function TableTemplate({ 
                  distributions,
                  resourceName,
                  buttonName,
                  buttonHref,
                  activeHref,
                  loadingState
                  }) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const appLayout = useRef();
  const {notificationitems} = useSimpleNotifications();

  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref={activeHref} />}
      notifications={<Flashbar items={notificationitems} />}
      breadcrumbs={<Breadcrumbs />}
      content={<TableContent 
                distributions={distributions}
                resourceName={resourceName}
                buttonName={buttonName}
                buttonHref={buttonHref}
                loadingState={loadingState}
            />}
      contentType="table"
      //tools={<ToolsContent />}
      toolsOpen={toolsOpen}
      onToolsChange={({ detail }) => setToolsOpen(detail.open)}
      stickyNotifications
    />
  );
}
