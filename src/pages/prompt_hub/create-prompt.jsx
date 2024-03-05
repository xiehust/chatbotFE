// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useRef, useState,createContext } from 'react';
import { Breadcrumbs, ToolsContent } from './common-components';
import FormContent from './prompt-form';
import {
  CustomAppLayout,
  Navigation,
  Notifications,
} from '../commons/common-components';
import { Flashbar } from '@cloudscape-design/components';
import {useSimpleNotifications} from '../commons/use-notifications';

export default function CreatePromptApp() {
  const appLayout = useRef();
  const {notificationitems} = useSimpleNotifications();
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref="/prompt_hub/create" />}
      notifications={<Flashbar items={notificationitems} />}
      breadcrumbs={<Breadcrumbs />}
      content={<FormContent/>}
      contentType="table"
      stickyNotifications
    />
  );
}
