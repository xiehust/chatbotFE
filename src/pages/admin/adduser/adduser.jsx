// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useRef, useState,createContext } from 'react';
import { Breadcrumbs, ToolsContent } from './common-components';
import FormContent from './user-form';
import {
  CustomAppLayout,
  Navigation,
  Notifications,
} from '../../commons/common-components';
import { Flashbar } from '@cloudscape-design/components';
import {useSimpleNotifications} from '../../commons/use-notifications';

export default function AddUserApp() {
  const appLayout = useRef();
  const {notificationitems} = useSimpleNotifications();
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref="/admin/user" />}
      notifications={<Flashbar items={notificationitems} />}
      breadcrumbs={<Breadcrumbs />}
      content={<FormContent/>}
      // toolsOpen={toolsOpen}
      // onToolsChange={({ detail }) => setToolsOpen(detail.open)}
      contentType="table"
      stickyNotifications
    />
  );
}
