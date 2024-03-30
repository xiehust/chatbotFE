// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { CollectionPreferences, StatusIndicator, Link } from '@cloudscape-design/components';
import { addColumnSortLabels } from '../../common/labels';
import {EditCell} from './common-components';
import i18n from '../../common/i18n';

export const COLUMN_DEFINITIONS = addColumnSortLabels( [
  {
    id: "id",
    header: "Id",
    cell: item => item.msgid || "-",
    minWidth: 80,
  },
  {
    id: "title",
    header: i18n.t("title"),
    cell: item => item.title || "-",
    minWidth: 180,
  },
  {
    id: "description",
    header: i18n.t("description"),
    cell: item => item.description || "-",
    minWidth: 180,
  },
  {
    id: "username",
    header: i18n.t("requester_name"),
    cell: item => item.username || "-",
    minWidth: 80,
  },
  {
    id: "status",
    header: "Status",
    cell: item => (<StatusIndicator type={
      item.status === 'accepted'? 'success' : (item.status === 'thumbs-up'?'info':(item.status === 'thumbs-down'?'error':'pending'))
      }
    >{item.status || "N/A" }
    </StatusIndicator> ),
    minWidth: 80,
  },
  {
    id: "createtime",
    header: i18n.t("createtime"),
    cell: item => item.createtime || "-",
    minWidth: 80,
    // sortingField: "timestamp",
  },
])

export const DEFAULT_PREFERENCES = {
  pageSize: 30,
  visibleContent: ['title','description', 'username','status','createtime'],
  wrapLines: false,
};




const VISIBLE_CONTENT_OPTIONS = [
  {
    label: 'Main Databases properties',
    options: [

      { id: 'title', label: i18n.t("title") },
      { id: 'status', label: i18n.t("status") },
      { id: 'description', label: i18n.t("description")},
      { id: 'username', label: i18n.t("requester_name") },
      { id: 'createtime', label: i18n.t("createtime") },
    ],
  },
];

export const PAGE_SIZE_OPTIONS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 30, label: '30' },
  { value: 50, label: '50' },
];


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

export const FILTERING_PROPERTIES = [
  // {
  //   propertyLabel: 'Message Id',
  //   key: 'id',
  //   groupValuesLabel: 'Message Id values',
  //   operators: ['='],
  // },
  // {
  //   propertyLabel: 'Session Id',
  //   key: 'sid',
  //   groupValuesLabel: 'Session Id values',
  //   operators: ['='],
  // },
  {
    propertyLabel: 'Status',
    key: 'action',
    groupValuesLabel: 'Status values',
    operators: ['='],
  },
].sort((a, b) => a.propertyLabel.localeCompare(b.propertyLabel));