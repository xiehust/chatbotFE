// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { CollectionPreferences,Badge,SpaceBetween, Link ,StatusIndicator} from '@cloudscape-design/components';
import { addColumnSortLabels } from '../../common/labels';
import i18n from '../../common/i18n';


const VISIBLE_CONTENT_OPTIONS = [
  {
    label: i18n.t('info_field'),
    options: [
      { id: 'id', label: i18n.t('template_id') },
      { id: 'template_name', label: i18n.t('template_name') },
      { id: 'comment', label: i18n.t('comment'),},
      { id: 'username', label:  i18n.t('created_by'), },
    ],
  },
];



export const DEFAULT_PREFERENCES = {
  pageSize: 30,
  visibleContent: ['id','template_name','comment','username'],
  wrapLines: false,
};

export const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 30, label: '30' },
  { value: 50, label: '50' },
];

export const COLUMN_DEFINITIONS = addColumnSortLabels([
  {
    id: 'id',
    header: i18n.t('template_id'),
    cell: item => <Link href={`/template/${item?.id}`}>{item?.id}</Link>,
    sortingField: "id",
  },
  {
    id: 'template_name',
    header: i18n.t('template_name'),
    cell: item => <Link href={`/template/${item?.id}`}>{item?.template_name}</Link>,
    sortingField: "template_name",
  },
  {
    id: 'comment',
    cell: item =>item.comment||'-',
    header: i18n.t('comment'),
    sortingField: "comment",
  },
  {
    id: 'username',
    cell: item =>item.username||'-',
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

