// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React,{useState,useEffect} from "react";
import {
  BreadcrumbGroup,
  SpaceBetween,
  Button,
  Modal,
  Box,
  CodeEditor
} from "@cloudscape-design/components";
import { TableHeader } from "../commons/common-components";
import { useTranslation, Trans } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import {params_local_storage_key} from "../chatbot/common-components";
import {deleteTemplate} from "../commons/api-gateway";
import {useAuthorizedHeader,useAuthUserInfo} from "../commons/use-auth";
import {useSimpleNotifications} from '../commons/use-notifications';

import 'ace-builds/css/ace.css';
import 'ace-builds/css/theme/dawn.css';
import 'ace-builds/css/theme/tomorrow_night_bright.css';

// const ace = await import('ace-builds');
// ace.config.set('useStrictCSP', true);


export const TemplateEditor = (props) =>{
  const [preferences, setPreferences] = useState(
    undefined
  );
  const [ace, setAce] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAce() {
      const ace = await import('ace-builds');
      await import('ace-builds/webpack-resolver');
      ace.config.set('useStrictCSP', true);

      return ace;
    }

    loadAce()
      .then(ace => setAce(ace))
      .finally(() => setLoading(false));
  }, []);
  return <CodeEditor 
         {...props}
         preferences={preferences}
        onPreferencesChange={e => setPreferences(e.detail)}
          ace={ace}
          loading={loading}
          language="python"
          themes={{ dark: ['dawn'], light: ['tomorrow_night_bright'] }}
/>
}

export const Breadcrumbs = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/",
    },
    {
      text: t("prompt_template"),
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
          text: t("prompt_template"),
          href: "/template",
        },
        {
          text: id,
          href: "/template/" + id,
        },
      ]}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
    />
  );
};
export const DeleteConfirmModal = ({selectItem,visible,setVisible,refreshAction}) =>{
  const { t } = useTranslation();
  const { setNotificationItems } = useSimpleNotifications();

  const headers = useAuthorizedHeader();

  const [loading, setLoading] = useState(false);

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+username,
    null
  );
  const msgid = `msg-${Math.random().toString(8)}`;
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;
  const deleteAction = () =>{
    setLoading(true);
    const payload = {
      ...selectItem,
      main_fun_arn:main_fun_arn,
      apigateway_endpoint:apigateway_endpoint
    };
    console.log(payload);
    deleteTemplate(headers,payload)
    .then(res=>{
      setNotificationItems((item) => [
        ...item,
        {
          header: t('delete_template'),
          type: "success",
          content: t('delete_template')+' success',
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () =>
            setNotificationItems((items) =>
              items.filter((item) => item.id !== msgid)
            ),
          id: msgid,
        },
      ]);
      setLoading(false);
      setVisible(false);
      refreshAction();
    })
    .catch(err =>{
      setNotificationItems(() => [
        {
          header: t("delete_template"),
          content: `${err.message}`,
          type: "error",
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () => setNotificationItems([]),
          id: msgid,
        },
      ]);
      setLoading(false);
      setVisible(false);
    })

  }
  return (
    <Modal
      onDismiss={() => setVisible(false)}
      visible={visible}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link"
              onClick={()=>setVisible(false)}
            >{t('cancel')}</Button>
            <Button variant="primary"
            loading = {loading}
             onClick={deleteAction}
            >{t('confirm')}</Button>
          </SpaceBetween>
        </Box>
      }
      header={t('delete')}
    >
      {t('delete_template')+':'+selectItem?.template_name}
    </Modal>
  );

};

export const FullPageHeader = ({
  resourceName,
  createButtonText,
  ...props
}) => {
  const { t } = useTranslation();
  const isOnlyOneSelected = props.selectedItems.length === 1;
  const [visible, setVisible] = useState(false)
  const deleteAction = ()=>{
    setVisible(true);
  };
  const selectItem = isOnlyOneSelected ? props.selectedItems[0]: undefined;
  // console.log(selectItem);
  return (
    <div>
      <DeleteConfirmModal visible={visible} setVisible={setVisible} selectItem={selectItem} refreshAction={props.refreshAction} />
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
          <Button
            disabled={!isOnlyOneSelected}
            name="delete"
            onClick={deleteAction}
          >
            {t('delete')}
          </Button>
          {/* <Button
            disabled={!isOnlyOneSelected}
            name="edit"
            onClick={deleteAction}
          >
            {t('edit')}
          </Button> */}
          <Button
            href={'/template/create'}
            variant="primary"
          >{t('create')}
          </Button>
        </SpaceBetween>
      }
      {...props}
    />
    </div>
  );
};
