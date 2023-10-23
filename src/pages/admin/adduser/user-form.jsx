import React, { createContext, useContext, useState, memo } from "react";
import {
  Form,
  SpaceBetween,
  Button,
  FormField,
  Container,
  Header,
  Input,
  Select,
  Multiselect,
  ColumnLayout,
  Tabs,
} from "@cloudscape-design/components";
import { ModalPopup } from "./common-components";
import remoteApis from "../../commons/remote-apis";
import { useAuthorizedHeader } from "../../commons/use-auth";
import { formatDate, dbRespErrorMapping } from "../../commons/utils";
import { useNavigate } from "react-router-dom";
import { useSimpleNotifications } from "../../commons/use-notifications";
import { API_users, remotePostCall } from "../../commons/api-gateway";
import { useTranslation } from 'react-i18next';


const addUserFormCtx = createContext();

function validateForm(props) {
  if (
    !props.username?.length ||
    !props.email?.length ||
    !props.password?.length
  ) {
    return false;
  } else return true;
}

function BaseFormContent({ content, onCancelClick, errorText = null }) {
  const {t} = useTranslation();
  const { formData } = useContext(addUserFormCtx);
  const { setNotificationItems } = useSimpleNotifications();
  const headers = useAuthorizedHeader();
  const navigate = useNavigate();
  const [sumbitloading, setSubLoading] = useState(false);
  const msgid = Math.random().toString(16);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubLoading(true);
        // console.log(JSON.stringify(formData));
        if (!validateForm(formData)) {
          alert("Missing form data");
          return "";
        }
        if (formData.password !== formData.repassword) {
          alert("Password not match");
          return "";
        }
        // const nowtime = formatDate(new Date());
        console.log(JSON.stringify(formData));
        const body = { ...formData, status: "active" };
        return remotePostCall(headers, API_users, body)
          .then((data) => {
            setSubLoading(false);
            setNotificationItems((item) => [
              ...item,
              {
                header: `Success to add user`,
                type: "success",
                content: `Success to add user [${formData.username}]`,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () =>
                  setNotificationItems((items) =>
                    items.filter((item) => item.id !== msgid)
                  ),
                id: msgid,
              },
            ]);
            navigate("/admin/user");
          })
          .catch((error) => {
            console.log(error);
            setSubLoading(false);
            setNotificationItems(() => [
              {
                header: "Failed to add user",
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
            {t('adduser')}
          </Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={(event)=>{
              event.preventDefault();
              navigate('/admin/user')}} >
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

function SelectGroup({ setFormData }) {
  const {t} = useTranslation();
  const [statusType, setStatusType] = useState("pending");
  const [options, setOptions] = useState([
    {
      label:t('admin_group'),
      value:'admin_group'
    },
    {
      label:t('normal_group'),
      value:'normal_group'
    },

  ]);
  const [selectedOption, setSelectedOption] = useState(null);
  return (
    <Select
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        setSelectedOption(detail.selectedOption);
        setFormData((prev) => ({
          ...prev,
          groupid: detail.selectedOption.value,
        }));
      }}
      options={options}
      selectedAriaLabel="Selected"
      statusType={statusType}
    />
  );
}

function AddUserPanel({ readOnlyWithErrors = false }) {

  const {t} = useTranslation();
  const partitions = [{
    label:t('china'),value:'china'},
    {label:t('global'),value:'global'},
  ]
  const { formData, setFormData } = useContext(addUserFormCtx);
  const [selectedOption, setSelectedOption] = useState(partitions[1]);
  const getErrorText = (errorMessage) => {
    return readOnlyWithErrors ? errorMessage : undefined;
  };

  return (
    <Container
    >
      <SpaceBetween size="l">
        <FormField
          label={t("username")}
          errorText={getErrorText("You must enter a unique username")}
          i18nStrings={{ errorIconAriaLabel: "Error" }}
        >
          <Input
            placeholder="Username"
            ariaRequired={true}
            value={formData.username}
            onChange={(event) =>
              !readOnlyWithErrors &&
              setFormData((prev) => ({ ...prev, username: event.detail.value }))
            }
          />
        </FormField>
        <FormField
          label="Email"
          errorText={getErrorText("You must enter a valid email")}
          i18nStrings={{ errorIconAriaLabel: "Error" }}
        >
          <Input
            placeholder="Email"
            type="email"
            ariaRequired={true}
            value={formData.email}
            onChange={(event) =>
              !readOnlyWithErrors &&
              setFormData((prev) => ({ ...prev, email: event.detail.value }))
            }
          />
        </FormField>

        <FormField label={t('select_user_group')}>
          <SelectGroup setFormData={setFormData} />
        </FormField>
        <FormField
          label={t("password")}
          errorText={getErrorText("You must enter a valid password")}
          i18nStrings={{ errorIconAriaLabel: "Error" }}
        >
          <Input
            placeholder="Enter a password"
            // type="password"
            ariaRequired={true}
            value={formData.password}
            onChange={(event) =>
              !readOnlyWithErrors &&
              setFormData((prev) => ({ ...prev, password: event.detail.value }))
            }
          />
        </FormField>
        <FormField
          label={t('confirm_password')}
          errorText={getErrorText("You must enter a valid email")}
          i18nStrings={{ errorIconAriaLabel: "Error" }}
        >
          <Input
            placeholder="Confirm password"
            // type="password"   
            ariaRequired={true}
            value={formData.repassword}
            onChange={(event) =>
              !readOnlyWithErrors &&
              setFormData((prev) => ({
                ...prev,
                repassword: event.detail.value,
              }))
            }
          />
        </FormField>
      </SpaceBetween>
    </Container>
  );
}

export default function FormContent() {
  const [formData, setFormData] = useState({
    // username: "",
    // email: "",
    // password: "",
    // repassword: "",
    // groupid: "",
    // groupids: [],
  });
  const navigate = useNavigate();
  return (
    <addUserFormCtx.Provider value={{ formData, setFormData }}>
      <BaseFormContent
        content={
          <SpaceBetween size="l">
            <AddUserPanel />
          </SpaceBetween>
        }
        // onCancelClick={() => {
        //   navigate('/admin/user')
        // }}
      />
    </addUserFormCtx.Provider>
  );
}
