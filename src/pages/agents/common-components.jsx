// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState, useEffect,useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  BreadcrumbGroup,
  SpaceBetween,
  Button,
  Modal,
  Box,
  FormField,
  Toggle,
  Input,
  CodeEditor,
  ExpandableSection,
  Container,
  Header,
  Textarea,
  Form,
} from "@cloudscape-design/components";
import { TableHeader } from "../commons/common-components";
import { useTranslation, Trans } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import { params_local_storage_key } from "../chatbot/common-components";
import { deleteAgent } from "../commons/api-gateway";
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import { useSimpleNotifications } from '../commons/use-notifications';
import { UploadPanel } from './file-uploader';
import { generateUUID,getTimestamp } from "../commons/utils";
import { addAgent } from "../commons/api-gateway";


import 'ace-builds/css/ace.css';
import 'ace-builds/css/theme/dawn.css';
import 'ace-builds/css/theme/tomorrow_night_bright.css';

// const ace = await import('ace-builds');
// ace.config.set('useStrictCSP', true);

export const generateId = () => {
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2, 8);
  return `${timestamp}-${randomNumber}`
}

export const OpeningQuesionsComp = ({ formData, setFormData }) => {
  const [cnts,setCnts] = useState(
    formData.opening_questions
    ?Object.keys(formData.opening_questions).map(key => Number(key))
    :[1,2,3]);
  return (
<SpaceBetween size='xs'>
      {cnts.map(sn => <OpeningQuesionInputComp key={sn} sn={sn} formData={formData} setFormData={setFormData} />)}
      <SpaceBetween size='xs' direction="horizontal">
        <Button iconName="add-plus" variant="icon" 
        disabled = {cnts.length>=5}
          onClick={(event)=>{
            event.preventDefault();
            setCnts(prev => [...prev,prev[prev.length-1]+1])
        }}/>
        <Button iconName="remove" variant="icon" 
        disabled = {cnts.length<=1}
          onClick={(event)=>{
            event.preventDefault();
            setCnts((prev) => prev.slice(0,prev.length-1))
        }}/>
      </SpaceBetween>
</SpaceBetween>
  )
}

const OpeningQuesionInputComp = ({ sn,formData,setFormData }) => {
  const {t} = useTranslation();
  const [inValid,setInvalid] = useState(false);
  const [inputVal, setInputVal] = useState(
                  formData.opening_questions?formData.opening_questions[sn]??'':'');
  return (
      <FormField
        label={t("opening_question")+' '+sn}
        constraintText={`${inputVal.length}/100`}
      >
        <Input
          invalid={inValid}
          ariaRequired={true}
          placeholder="Optional"
          value={inputVal}
          onChange={({detail}) => {
            detail.value?.length > 100 ? setInvalid(true) : setInvalid(false);
            const restrict_val = detail.value.slice(0, 100);
            setInputVal(restrict_val);
            setFormData((prev) => ({ ...prev, opening_questions: {...prev.opening_questions,[sn]:restrict_val}}));
          }
          }
        />
      </FormField>
  )
}

function validateForm(props) {
  if (
    !props.agent_name?.length ||
    !props.system_role_prompt?.length
  ) {
    return false;
  } else return true;
}


export const BaseFormContent = ({ content,formCtx, onCancelClick, errorText = null }) => {
  const { t } = useTranslation();
  const { formData, setInvalid } = useContext(formCtx);
  const { setNotificationItems } = useSimpleNotifications();
  const headers = useAuthorizedHeader();
  const userInfo = useAuthUserInfo();
  const company = userInfo?.company || 'default';

  const navigate = useNavigate();
  const [sumbitloading, setSubLoading] = useState(false);
  const agentid = generateUUID();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!validateForm(formData)) {
          setInvalid(true);
          return "";
        }
        setSubLoading(true);
        
        const body = {
          ...formData,
          id: agentid,
          createtime:getTimestamp(),
          username: userInfo.username,
          company: company
        };
        console.log(JSON.stringify(body));
        return addAgent(headers, body)
          .then((data) => {
            setSubLoading(false);
            setNotificationItems((item) => [
              ...item,
              {
                header: `Success to create agent`,
                type: "success",
                content: `Success to create`,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () =>
                  setNotificationItems((items) =>
                    items.filter((item) => item.id !== agentid)
                  ),
                id: agentid,
              },
            ]);
            navigate("/agents");
          })
          .catch((error) => {
            console.log(error);
            setSubLoading(false);
            setNotificationItems(() => [
              {
                header: "Failed to create agent",
                type: "error",
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () => setNotificationItems([]),
                id: agentid,
              },
            ]);
          });
      }}
    >
      <Form
        header={
          <Header
            variant="h1"
          >
            {t('create_agent')}
          </Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={(event) => {
              event.preventDefault();
              navigate('/agents')
            }} >
              {t('cancel')}
            </Button>
            <Button loading={sumbitloading} variant="primary">
              {t('confirm')}
            </Button>
          </SpaceBetween>
        }
        errorText={errorText}
        errorIconAriaLabel="Error"
      >
        {content}
      </Form>
    </form>
  );
}

export const  AddPanel = ({ formCtx,readOnlyWithErrors = false }) =>{

  const { t } = useTranslation();
  const { formData, setFormData, inValid, setInvalid } = useContext(formCtx);

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );

  return (
    <div>
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">{t('basic_info')}</Header>}
        >
          <SpaceBetween size="l">
            <FormField
              label={t("agent_name")}
              constraintText={`${formData.agent_name ? formData.agent_name.length : 0}/15`}
            >
              <Input
                invalid={inValid}
                ariaRequired={true}
                placeholder="Required"
                value={formData.agent_name}
                onChange={(event) => {
                  !readOnlyWithErrors &&
                    setFormData((prev) => ({ ...prev, agent_name: event.detail.value.slice(0, 15) }));
                  event.detail.value?.length > 15 ? setInvalid(true) : setInvalid(false);
                }
                }
              />
            </FormField>
            <FormField
              label={t("description")}
              constraintText={`${formData.description ? formData.description.length : 0}/150`}
            >
              <Input
                invalid={inValid}
                placeholder="Optional"
                ariaRequired={true}
                value={formData.description}
                onChange={(event) => {
                  !readOnlyWithErrors &&
                    setFormData((prev) => ({ ...prev, description: event.detail.value.slice(0, 150) }));
                  event.detail.value?.length > 150 ? setInvalid(true) : setInvalid(false);
                }
                }
              />
            </FormField>
            <FormField
              label={t("system_role_prompt")}
              constraintText={`${formData.system_role_prompt ? formData.system_role_prompt.length : 0}/2000`}
            >
              <Textarea
                placeholder="Required"
                rows={12}
                ariaRequired={true}
                value={formData.system_role_prompt}
                onChange={(event) => {
                  !readOnlyWithErrors &&
                    setFormData((prev) => ({ ...prev, system_role_prompt: event.detail.value.slice(0, 2000) }));
                  event.detail.value?.length > 2000 ? setInvalid(true) : setInvalid(false);
                }
                }
              />
            </FormField>
          </SpaceBetween>
        </Container>
        <Container>
          <ExpandableSection defaultExpanded headerText={t("capability")}>
            <SpaceBetween size="m">
              <CheckboxComp label="web_search" setFormData={setFormData} formData={formData} />
              <CheckboxComp label="code_executor" setFormData={setFormData} formData={formData}/>
              <CheckboxComp label="text_image" setFormData={setFormData} formData={formData}/>
            </SpaceBetween>
          </ExpandableSection>
        </Container>
        <Container>
          <KBComp />
        </Container>
        <Container>
          <ExpandableSection defaultExpanded headerText={t("opening_dialog")}>
            <SpaceBetween size="l">
              <FormField
                label={t("opening_text")}
                constraintText={`${formData.opening_text ? formData.opening_text.length : 0}/200`}
              >
                <Textarea
                  placeholder="Optional"
                  rows={1}
                  ariaRequired={true}
                  value={formData.opening_text}
                  onChange={(event) => {
                    !readOnlyWithErrors &&
                      setFormData((prev) => ({ ...prev, opening_text: event.detail.value.slice(0, 200) }));
                    event.detail.value?.length > 200 ? setInvalid(true) : setInvalid(false);
                  }
                  }
                />
              </FormField>
              <OpeningQuesionsComp formData={formData} setFormData={setFormData} />
            </SpaceBetween>
          </ExpandableSection>
        </Container>
      </SpaceBetween>
    </div>
  );
}

export const KBComp = ({ formData,setFormData }) => {
  const { t } = useTranslation();

  return (
    <ExpandableSection defaultExpanded headerText={t("knowledge_base")}>
      <UploadPanel />
    </ExpandableSection>
  )
}

export const CheckboxComp = ({ label, formData,setFormData }) => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(formData[label]??false);
  return (
    <Toggle
      onChange={({ detail }) => {
        setChecked(detail.checked);
        setFormData((prev) => ({ ...prev, [label]: detail.checked }));
      }
      }
      checked={checked}
    >
      {t(label)}
    </Toggle>
  );

}
export const Breadcrumbs = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/",
    },
    {
      text: t("agents"),
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
          text: t("agents"),
          href: "/agents",
        },
        {
          text: id,
          href: "/agents/" + id,
        },
      ]}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
    />
  );
};
export const DeleteConfirmModal = ({ selectItem, visible, setVisible, refreshAction }) => {
  const { t } = useTranslation();
  const { setNotificationItems } = useSimpleNotifications();

  const headers = useAuthorizedHeader();

  const [loading, setLoading] = useState(false);

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );
  const msgid = `msg-${Math.random().toString(8)}`;
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;
  const deleteAction = () => {
    setLoading(true);
    const payload = {
      agentid: selectItem.id
      // main_fun_arn: main_fun_arn,
      // apigateway_endpoint: apigateway_endpoint
    };
    console.log(payload);
    deleteAgent(headers, payload)
      .then(res => {
        setNotificationItems((item) => [
          ...item,
          {
            header: t('delete_agent'),
            type: "success",
            content: t('delete_agent') + ' success',
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
      .catch(err => {
        setNotificationItems(() => [
          {
            header: t("delete_agent"),
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
              onClick={() => setVisible(false)}
            >{t('cancel')}</Button>
            <Button variant="primary"
              loading={loading}
              onClick={deleteAction}
            >{t('confirm')}</Button>
          </SpaceBetween>
        </Box>
      }
      header={t('delete')}
    >
      {t('delete_agent') + ':' + selectItem?.agent_name}
    </Modal>
  );

};

export const FullPageHeader = ({
  resourceName,
  createButtonText,
  ...props
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isOnlyOneSelected = props.selectedItems.length === 1;
  const [visible, setVisible] = useState(false)
  const deleteAction = () => {
    setVisible(true);
  };
  const selectItem = isOnlyOneSelected ? props.selectedItems[0] : undefined;
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
            <Button
            disabled={!isOnlyOneSelected}
            name="chat"
            onClick={(event) =>{
              event.preventDefault();
              navigate(`/agentschat/${selectItem.id}`)
            }}
          >
            {t('start_chat')}
          </Button>
            <Button
              href={'/agents/create'}
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
