import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Form,
  SpaceBetween,
  Button,
  FormField,
  Container,
  Box,
  Link,
  Header,
} from "@cloudscape-design/components";
import { generateId,DetailPanel,useTemplateFormCtx,addTemplateFormCtx} from "./common-components";
import { useAuthorizedHeader,useAuthUserInfo } from "../commons/use-auth";
import { useNavigate } from "react-router-dom";
import { useSimpleNotifications } from "../commons/use-notifications";
import {  addPrompt } from "../commons/api-gateway";
import { useTranslation } from 'react-i18next';
import {params_local_storage_key} from "./common-components";
import { useLocalStorage } from '../../common/localStorage';


function validateForm(props) {
  if (
    !props.template_name ||
    !props.prompt_category||
    !props.geo||
    !props.email
      ) {
    return false;
  } else return true;
}


function BaseFormContent({ content, onCancelClick, errorText = null }) {
  const {t} = useTranslation();
  const { formData ,setInvalid} = useTemplateFormCtx();
  const { setNotificationItems } = useSimpleNotifications();
  const headers = useAuthorizedHeader();
  const userInfo = useAuthUserInfo();
  const company = userInfo?.company || 'default';

  const navigate = useNavigate();
  const [sumbitloading, setSubLoading] = useState(false);
  const msgid = generateId();
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+userInfo.username,
    null
  );
  // const main_fun_arn = localStoredParams?.main_fun_arn;
  // const apigateway_endpoint = localStoredParams?.apigateway_endpoint;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!validateForm(formData)) {
          setInvalid(true);
          return "";
        }
        setSubLoading(true);
        // console.log(JSON.stringify(formData));
        const id = msgid;
        const body = { ...formData, 
        id: id, 
        // main_fun_arn:main_fun_arn,
        // apigateway_endpoint:apigateway_endpoint,
        username:userInfo.username,
        company:company
       };

        return addPrompt(headers, body)
          .then((data) => {
            setSubLoading(false);
            setNotificationItems((item) => [
              ...item,
              {
                header: `Success to create prompt`,
                type: "success",
                content: <Box>{'Created new prompt template:'}<Link href={`/prompt_hub/${id}`}>{`${formData?.template_name}`}</Link></Box>,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () =>
                  setNotificationItems((items) =>
                    items.filter((item) => item.id !== msgid)
                  ),
                id: msgid,
              },
            ]);
            navigate("/prompt_hub");
          })
          .catch((error) => {
            console.log(error);
            setSubLoading(false);
            setNotificationItems(() => [
              {
                header: "Failed to create template",
                type: "error",
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () => setNotificationItems([]),
                id: msgid,
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
            {t('add_template')}
          </Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={(event)=>{
              event.preventDefault();
              navigate('/prompt_hub')}} >
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







export default function FormContent() {
  const [inValid,setInvalid] = useState(false);
  const [formData, setFormData] = useState({
    template:''
  });
  return (
    <addTemplateFormCtx.Provider value={{ formData, setFormData,inValid,setInvalid }}>
      <BaseFormContent
        content={
          <SpaceBetween size="l">
            <DetailPanel />
          </SpaceBetween>
        }
      />
    </addTemplateFormCtx.Provider>
  );
}
