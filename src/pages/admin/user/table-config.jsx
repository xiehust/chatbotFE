// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { CollectionPreferences, Link ,StatusIndicator} from '@cloudscape-design/components';
import { addColumnSortLabels } from '../../../common/labels';
import i18n from '../../../common/i18n';

export const COLUMN_DEFINITIONS = addColumnSortLabels([
  {
    id: 'username',
    sortingField: 'username',
    header: i18n.t('username'),
    cell: item => item.username,
  },
  {
    id: 'email',
    sortingField: 'email',
    header: i18n.t('email'),
    cell: item => item.email,
  },
  {
    id: 'group',
    sortingField: 'group',
    cell: item =>(
      item.groupname
    ),
    header: i18n.t('usergroup'),
  },
  {
    id: 'createtime',
    header: i18n.t('createtime'),
    cell: item => item.createtime,
  },
  {
    id: 'status',
    sortingField: 'status',
    header: i18n.t('status'),
    cell: item => (
      <StatusIndicator type={item.status === 'Inactive' ? 'stopped' : 'success'}>{item.status}</StatusIndicator>
    ),
    minWidth: 100,
  },
]);

const VISIBLE_CONTENT_OPTIONS = [
  {
    label: 'Main user properties',
    options: [
      { id: 'username', label: i18n.t('username'), editable: false },
      { id: 'email', label: i18n.t('email') },
      { id: 'group', label:  i18n.t('usergroup')  },
      { id: 'createtime', label:i18n.t('createtime') },
      { id: 'status', label:i18n.t('status') }
    ],
  },
];

export const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 30, label: '30' },
  { value: 50, label: '50' },
];

export const DEFAULT_PREFERENCES = {
  pageSize: 30,
  visibleContent: ['username', 'group','email', 'createtime','status'],
  wrapLines: false,
};

export const Preferences = ({
  preferences,
  setPreferences,
  disabled,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  visibleContentOptions = VISIBLE_CONTENT_OPTIONS,
}) => (
  <CollectionPreferences
    title="Preferences"
    confirmLabel="Confirm"
    cancelLabel="Cancel"
    disabled={disabled}
    preferences={preferences}
    onConfirm={({ detail }) => setPreferences(detail)}
    pageSizePreference={{
      title: 'Page size',
      options: pageSizeOptions,
    }}
    wrapLinesPreference={{
      label: 'Wrap lines',
      description: 'Check to see all the text and wrap the lines',
    }}
    visibleContentPreference={{
      title: 'Select visible columns',
      options: visibleContentOptions,
    }}
  />
);
