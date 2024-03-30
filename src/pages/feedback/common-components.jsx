// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState } from "react";
import {
  BreadcrumbGroup,
  HelpPanel,
  Icon,
  SpaceBetween,
  Button,
  Input,
  Textarea,
} from "@cloudscape-design/components";
import { ExternalLinkItem } from "../commons/common-components";
import { TableHeader } from "../commons/common-components";
import { useTranslation } from "react-i18next";

import { postFeedback,deleteFeedback } from "../commons/api-gateway";
import { useAuthUserInfo, useAuthorizedHeader } from "../commons/use-auth";
import { params_local_storage_key } from "../chatbot/common-components";
import { useLocalStorage } from "../../common/localStorage";
import { useSimpleNotifications } from "../commons/use-notifications";

const breadcrumbsItems = [
  {
    text: "Harbor",
    href: "/home",
  },
  {
    text: "Databases",
    href: "/catalog/databases",
  },
];

export const Breadcrumbs = () => {
  const { t } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/",
    },
    {
      text: t("feedback_us"),
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

export const BreadcrumbsDynmic = ({ id }) => (
  <BreadcrumbGroup
    items={[
      ...breadcrumbsItems,
      {
        text: id,
        href: "/catalog/database/" + id,
      },
    ]}
    expandAriaLabel="Show path"
    ariaLabel="Breadcrumbs"
  />
);

export const FullPageHeader = ({
  resourceName,
  createButtonText,
  ...props
}) => {
  const { t } = useTranslation();
  const { setNotificationItems } = useSimpleNotifications();
  const isOnlyOneSelected = props.selectedItems.length === 1;
  const sid = isOnlyOneSelected ? props.selectedItems[0].sid : null;
  const msgid = isOnlyOneSelected ? props.selectedItems[0].msgid : null;
  const origin_username = isOnlyOneSelected ? props.selectedItems[0].username : null;
  const [injectLoading, setInjectLoading] = useState(false);
  const [deleteLoading,setDeleteLoading] = useState(false);
  const userinfo = useAuthUserInfo();
  const usergroup = userinfo.groupname;
  const headers = useAuthorizedHeader();
  const username = userinfo?.username || "default";
  const company = userinfo?.company || "default";
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );
  const handleDelete = async () =>{
    const body = {
      id: msgid      
    };
    try {
      setDeleteLoading(true);
      const resp = await deleteFeedback(headers, body);
      setDeleteLoading(false);
      props.refreshAction();
      setNotificationItems((item) => [
        ...item,
        {
          header: t("delete_feedback"),
          type: "info",
          content: t("delete_feedback"),
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () =>
            setNotificationItems((items) =>
              items.filter((item) => item.id !== msgid)
            ),
          id: msgid,
        },
      ]);
    } catch (error) {
      console.log(error);
      setNotificationItems((item) => [
        ...item,
        {
          header: t("delete_feedback"),
          type: "error",
          content: JSON.stringify(error),
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () =>
            setNotificationItems((items) =>
              items.filter((item) => item.id !== msgid)
            ),
          id: msgid,
        },
      ]);
      setDeleteLoading(false);
    }
  }


  const handleUpdate =  async () => {
    setInjectLoading(true);
    const body = {
      id: msgid,
      status:'accepted'   
    };
    try {
      const resp = await postFeedback(headers, body);
      props.refreshAction();
      setNotificationItems((item) => [
        ...item,
        {
          header: t("update_feedback"),
          type: "success",
          content: `${t("update_feedback")} success`,
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () =>
            setNotificationItems((items) =>
              items.filter((item) => item.id !== msgid)
            ),
          id: msgid,
        },
      ]);
    } catch (error) {
      console.log(error);
      setNotificationItems((item) => [
        ...item,
        {
          header: t("update_feedback"),
          type: "error",
          content: JSON.stringify(error),
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () =>
            setNotificationItems((items) =>
              items.filter((item) => item.id !== msgid)
            ),
          id: msgid,
        },
      ]);
    }
    setInjectLoading(false);
  }
  return (
    <TableHeader
      variant="awsui-h1-sticky"
      title={resourceName}
      actionButtons={
        <SpaceBetween size="xs" direction="horizontal">
          <Button
            name="refresh"
            onClick={props.refreshAction}
            iconName="refresh"
          />
          {usergroup === "admin" &&<Button
            disabled={
              usergroup !== "admin" ||
              !isOnlyOneSelected ||
              props.selectedItems[0].status === "accepted"
            } //disable the button when status is injected
            name="accepted"
            loading={injectLoading}
            onClick={handleUpdate}
          >
            {t("accepted")}
          </Button>}
          {usergroup === "admin" &&<Button disabled={
              usergroup !== "admin" ||
              !isOnlyOneSelected 
              // ||props.selectedItems[0].status === "accepted"
          } name="delete"
          loading={deleteLoading}
            onClick={handleDelete}
          >
            {t("delete")}
          </Button>}
          <Button
            iconName="add-plus"
            variant="primary"
            onClick={props.handleAddClick}
          >
            {t("submit_new_feedback")}
          </Button>
        </SpaceBetween>
      }
      {...props}
    />
  );
};

const toolsFooter = (
  <>
    <h3>
      Learn more{" "}
      <span role="img" aria-label="Icon external Link">
        <Icon name="external" />
      </span>
    </h3>
    <ul>
      <li>
        <ExternalLinkItem href="" text="" />
      </li>
    </ul>
  </>
);
export const ToolsContent = () => (
  <HelpPanel footer={toolsFooter} header={<h2>GCR Chatbot</h2>}>
    <p>Demo for AWS GCR Chatbot</p>
  </HelpPanel>
);
