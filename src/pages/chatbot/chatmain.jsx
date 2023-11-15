// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useRef, useState,useEffect } from "react";
import { Breadcrumbs } from "./common-components";
import { CustomAppLayout, Navigation } from "../commons/common-components";
import {useSimpleNotifications} from '../commons/use-notifications';
import { Flashbar } from '@cloudscape-design/components';
import {isTokenExpires} from '../commons/utils';
import { useAuth } from '../commons/use-auth';


import Content from "./content";

const ChatBot = () => {

     //check and refresh tokens every 5 sec
    const auth = useAuth();
    useEffect(()=>{
      const refreshToken = async () => {
        console.log(`token expires, and refresh response:`,await auth.refresh_token());
      }
      const timerId = setInterval(() => {
        if (isTokenExpires()){
           refreshToken();
        }
      },5000);
      return () => {
        clearInterval(timerId); // Destroy timer on unmount
      };
    },[]);

    

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
