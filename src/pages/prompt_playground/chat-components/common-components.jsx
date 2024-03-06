// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, {createContext, useContext} from 'react';
import { BreadcrumbGroup, HelpPanel, Icon, Box,Link } from '@cloudscape-design/components';
import { useTranslation } from "react-i18next";


export function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16).slice(3);

  return `id-${timestamp}-${hexadecimalString}`;
}

export const ChatDataCtx = createContext();
export const useChatData = ()=>{
  return useContext(ChatDataCtx)
}

export const params_local_storage_key = "agentschat-params-prompt-panel-";


export const Breadcrumbs = () => {
    const { t, i18n } = useTranslation();
    const breadcrumbs = [
      {
        text: t("awschatportal"),
        href: "/",
      },
      {
        text: t("chat_agent"),
      },
    ];
    return (
      <BreadcrumbGroup
        items={breadcrumbs}
        expandAriaLabel="Show path"
        ariaLabel="Breadcrumbs"
      />
    );
  };
  
  export const BreadcrumbsDynmic = ({ id }) => {
    const { t } = useTranslation();
    return (
      <BreadcrumbGroup
        items={[
          {
            text: t("awschatportal"),
            href: "/home",
          },
          {
            text: t("chat_agent"),
            href: "/agentschat",
          },
          {
            text: id,
            href: "/agentschat/" + id,
          },
        ]}
        expandAriaLabel="Show path"
        ariaLabel="Breadcrumbs"
      />
    );
  };
