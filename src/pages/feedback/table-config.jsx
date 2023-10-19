// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { CollectionPreferences, StatusIndicator, Link } from '@cloudscape-design/components';
import { addColumnSortLabels } from '../../common/labels';

export const COLUMN_DEFINITIONS = addColumnSortLabels( [
  {
    id: "id",
    header: "Message Id",
    cell: item => item.msgid || "-",
    minWidth: 80,
  },
  {
    id: "sid",
    header: "Session Id",
    cell: item => item.sid || "-",
    minWidth: 80,
  },
  {
    id: "question",
    header: "Question",
    cell: item => item.question || "-",
    minWidth: 180,
  },
  {
    id: "answer",
    header: "Original Answer",
    cell: item => item.answer || "-",
    minWidth: 180,
  },
  {
    id: "feedback",
    header: "New Answer",
    cell: item => item.feedback || "-",
    minWidth: 180,
  },
  {
    id: "action",
    header: "Status",
    cell: item => (<StatusIndicator type={
      item.action === 'injected'? 'success' : (item.action === 'thumbs-up'?'info':(item.action === 'thumbs-down'?'error':'pending'))
      }
    >{item.action || "-" }
    </StatusIndicator> ),

    minWidth: 80,
  },
  {
    id: "username",
    header: "User Name",
    cell: item => item.username || "-",
    minWidth: 80,
  },
  {
    id: "timestamp",
    header: "Timestamp",
    cell: item => item.timestamp || "-",
    minWidth: 80,
    sortingField: "timestamp",
  },
])

export const DEFAULT_PREFERENCES = {
  pageSize: 30,
  visibleContent: ['question','feedback', 'action','timestamp'],
  wrapLines: false,
};




const VISIBLE_CONTENT_OPTIONS = [
  {
    label: 'Main Databases properties',
    options: [
      { id: 'id', label: 'Message Id', },
      { id: 'sid', label: 'Session Id', },
      { id: 'question', label: 'Question' },
      { id: 'answer', label: 'Original Answer' },
      { id: 'action', label: 'Status' },
      { id: 'feedback', label: 'New Answer' },
      { id: 'username', label: 'User Name' },
      { id: 'timestamp', label: 'Timestamp' },

    ],
  },
];

export const PAGE_SIZE_OPTIONS = [
  { value: 2, label: '2' },
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
    propertyLabel: 'Feedback',
    key: 'action',
    groupValuesLabel: 'Feedback values',
    operators: ['='],
  },
].sort((a, b) => a.propertyLabel.localeCompare(b.propertyLabel));