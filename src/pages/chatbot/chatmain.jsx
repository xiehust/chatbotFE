// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useRef, useState } from "react";
import { Breadcrumbs } from "./common-components";
import { CustomAppLayout, Navigation } from "../commons/common-components";
import {useSimpleNotifications} from '../commons/use-notifications';
import { Flashbar } from '@cloudscape-design/components';


import Content from "./content";

const ChatBot = () => {
  // const [toolsOpen, setToolsOpen] = useState(false);
  const appLayout = useRef();
  const {notificationitems} = useSimpleNotifications();
  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref="/chat" />}
      notifications={<Flashbar items={notificationitems} stackItems/>}
      breadcrumbs={<Breadcrumbs />}
      content={
<Content/>
      }
      // tools={<ToolsContent />}
      // toolsOpen={toolsOpen}
      // onToolsChange={({ detail }) => setToolsOpen(detail.open)}
      contentType="table"
      stickyNotifications
    />
  );
};

export default ChatBot;
