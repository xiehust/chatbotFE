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
  Input,
  Select
} from "@cloudscape-design/components";
import {addAsset,getAsset,deleteAsset} from '../commons/api-gateway'
import { addAssetFormCtx,useAssetFormCtx,DetailPanel,generateId,validateForm } from "./common-components";
import { useTranslation, Trans } from "react-i18next";
import {useSimpleNotifications} from '../commons/use-notifications';
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from '../../common/localStorage';
import {params_local_storage_key} from "./common-components";


function BaseFormContent({ content, onCancelClick, errorText = null }) {
  const {t} = useTranslation();
  const { formData ,setInvalid} = useAssetFormCtx();
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        console.log(JSON.stringify(formData))
        if (!validateForm(formData)) {
          setInvalid(true);
          console.log('validateForm failed')
          return "";
        }
        setSubLoading(true);
        const id = msgid;
        const body = { ...formData, 
              id: id, 
              demo_version: '2025v1',
              username:userInfo.username,
              company:company
          };

        return addAsset(headers, body)
          .then((data) => {
            setSubLoading(false);
            setNotificationItems((item) => [
              ...item,
              {
                header: `Success!`,
                type: "success",
                content: <Box>{'Created new asset:'}<Link href={`/asset_hub/${formData?.id}`}>{`${formData?.demo_name}`}</Link></Box>,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () =>
                  setNotificationItems((items) =>
                    items.filter((item) => item.id !== msgid)
                  ),
                id: msgid,
              },
            ]);
            navigate("/asset_hub");
          })
          .catch((error) => {
            console.log(error);
            setSubLoading(false);
            setNotificationItems(() => [
              {
                header: "Failed to create asset",
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
            {t('add_asset')}
          </Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={(event)=>{
              event.preventDefault();
              navigate('/asset_hub')}} >
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
    <addAssetFormCtx.Provider value={{ formData, setFormData,inValid,setInvalid }}>
      <BaseFormContent
        content={
          <SpaceBetween size="l">
            <DetailPanel />
          </SpaceBetween>
        }
      />
    </addAssetFormCtx.Provider>
  );
}
