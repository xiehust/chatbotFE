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
import { generateId,DetailPanel,useModelFormCtx,addModelFormCtx,validateForm} from "./common-components";
import { useAuthorizedHeader,useAuthUserInfo } from "../commons/use-auth";
import { useNavigate } from "react-router-dom";
import { useSimpleNotifications } from "../commons/use-notifications";
import {  addModelCard } from "../commons/api-gateway";
import { useTranslation } from 'react-i18next';
import {params_local_storage_key} from "../chatbot/common-components";
import { useLocalStorage } from '../../common/localStorage';




function BaseFormContent({ content, onCancelClick, errorText = null }) {
  const {t} = useTranslation();
  const { formData ,setInvalid} = useModelFormCtx();
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
        console.log(formData)
        if (!validateForm(formData)) {
          setInvalid(true);
          return "";
        }
        setSubLoading(true);
        console.log(JSON.stringify(formData));
        const id = msgid;
        const body = { ...formData, 
        id: id, 
        // main_fun_arn:main_fun_arn,
        // apigateway_endpoint:apigateway_endpoint,
        username:userInfo.username,
        company:company
       };

        return addModelCard(headers, body)
          .then((data) => {
            setSubLoading(false);
            setNotificationItems((item) => [
              ...item,
              {
                header: `Success!`,
                type: "success",
                content: <Box>{'Created new model card:'}<Link href={`/model_hub/${formData?.id}`}>{`${formData?.model_name}`}</Link></Box>,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () =>
                  setNotificationItems((items) =>
                    items.filter((item) => item.id !== msgid)
                  ),
                id: msgid,
              },
            ]);
            navigate("/model_hub");
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
            {t('add_model')}
          </Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={(event)=>{
              event.preventDefault();
              navigate('/model_hub')}} >
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
  });
  return (
    <addModelFormCtx.Provider value={{ formData, setFormData,inValid,setInvalid }}>
      <BaseFormContent
        content={
          <SpaceBetween size="l">
            <DetailPanel />
          </SpaceBetween>
        }
      />
    </addModelFormCtx.Provider>
  );
}
