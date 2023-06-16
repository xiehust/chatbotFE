// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { CollectionPreferences,Badge,SpaceBetween, Link ,StatusIndicator} from '@cloudscape-design/components';
import { addColumnSortLabels } from '../../common/labels';
import i18n from '../../common/i18n';


const VISIBLE_CONTENT_OPTIONS = [
  {
    label: i18n.t('job_info_field'),
    options: [
      { id: 'index_name', label: i18n.t('index_name'), editable: false },
      { id: 'embedding_model', label: i18n.t('embedding_model_name'),},
      { id: 'filename', label: i18n.t('filename'), },
      { id: 'username', label:  i18n.t('created_by'), },
    ],
  },
];



export const DEFAULT_PREFERENCES = {
  pageSize: 30,
  visibleContent: ['index_name','embedding_model', 'filename','username'],
  wrapLines: false,
};

export const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 30, label: '30' },
  { value: 50, label: '50' },
];

export const COLUMN_DEFINITIONS = addColumnSortLabels([
  {
    id: 'index_name',
    header: i18n.t('index_name'),
    cell: item => <Link href={`/docs/${item.index_name}`}>{item.index_name}</Link>,
    sortingField: "index_name",
  },
  {
    id: 'embedding_model',
    cell: item =>item.embedding_model,
    header: i18n.t('embedding_model_name'),
    sortingField: "embedding_model",
  },
  {
    id: 'filename',
    cell: item =>item.filename,
    header: i18n.t('filename'),
    sortingField: "filename",
  },
  {
    id: 'username',
    cell: item =>item.username,
    header: i18n.t('created_by'),
    sortingField: "username",
  },
]);




export const Preferences = ({
  preferences,
  setPreferences,
  disabled,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  visibleContentOptions = VISIBLE_CONTENT_OPTIONS,
}) => (
  <CollectionPreferences
    title={i18n.t('preferences')}
    confirmLabel={i18n.t('confirm')}
    cancelLabel={i18n.t('cancel')}
    disabled={disabled}
    preferences={preferences}
    onConfirm={({ detail }) => setPreferences(detail)}
    pageSizePreference={{
      title: i18n.t('page_size'),
      options: pageSizeOptions,
    }}
    wrapLinesPreference={{
      label: 'Wrap lines',
      description: 'Check to see all the text and wrap the lines',
    }}
    visibleContentPreference={{
      title: i18n.t('select_visible_columns'),
      options: visibleContentOptions,
    }}
  />
);

