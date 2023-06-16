// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useRef, useState } from "react";
import { Breadcrumbs, ToolsContent } from "./common-components";
import { CustomAppLayout, Navigation } from "../commons/common-components";
import Content from "./content";

const ChatBot = () => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const appLayout = useRef();
  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref="/chat" />}
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
