// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState, useEffect, useContext, createContext } from "react";
import {
  BreadcrumbGroup,
  SpaceBetween,
  Button,
  Modal,
  Box,
  Container,
  FormField,
  CodeEditor,
  Link,
  Input,
  Select,
  Textarea,
  Multiselect,
  Header,
  Toggle,
  Checkbox,
  DatePicker,
  RadioGroup,
} from "@cloudscape-design/components";
import { TableHeader } from "../commons/common-components";
import { useTranslation, Trans } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import {  addAsset,deleteAsset,getAsset } from "../commons/api-gateway";
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import { useSimpleNotifications } from '../commons/use-notifications';
import CreateQAModal from '../feedback/addfeedback';
import { DEMO_TYPE_CATS, DEMO_CATS,INSTRUSTRY_LIST,TEAM_CATS } from './table-config';


export const params_local_storage_key = 'assethub-localstorage';


export const addAssetFormCtx = createContext();

export const useAssetFormCtx = () => {
  return useContext(addAssetFormCtx);
}

export function validateForm(props) {
  if (
    !props.demo_name?.length ||
    !props.demo_type?.length||
    !props.industry?.length||
    !props.category?.length||
    !props.deck_link?.length||
    !props.demo_link?.length||
    !props.team?.length||
    !props.china_region_support?.length||
    !props.contact?.length||
    !props.code_repo_link?.length
      ) {
    return false;
  } else return true;
}



export const generateId = () => {
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2, 8);
  return `${timestamp}-${randomNumber}`
}

export const Breadcrumbs = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/asset_hub",
    },
    {
      text: t("asset_hub"),
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
          text: t("asset_hub"),
          href: "/asset_hub",
        },
        {
          text: id,
          href: "/asset_hub/" + id,
        },
      ]}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
    />
  );
};

const ReadOnlyBox = ({value}) =>{
  return (
    <Box>{value}</Box>
  )
}

const DemoTypeSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addAssetFormCtx);
  const initialOption = DEMO_TYPE_CATS.filter((it) => it.value === formData.demo_type);
  const [selectedOption, setSelectedOption] = useState( initialOption?initialOption[0]:undefined );
  return (
    <Select
      invalid={inValid && !formData.demo_type}
      disabled={readOnly}
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        setSelectedOption(detail.selectedOption);
        setFormData((prev) => ({
          ...prev,
          demo_type: detail.selectedOption.value,
        }));
      }}
      options={DEMO_TYPE_CATS}
      selectedAriaLabel="Selected"
    />
  )
}

const DemoCategorySelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addAssetFormCtx);
  const initialOption = DEMO_CATS.filter((it) => it.value === formData.category);
  const [selectedOption, setSelectedOption] = useState( initialOption?initialOption[0]:undefined );
  return (
    <Select
      invalid={inValid && !formData.category}
      disabled={readOnly}
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        setSelectedOption(detail.selectedOption);
        setFormData((prev) => ({
          ...prev,
          category: detail.selectedOption.value,
        }));
      }}
      options={DEMO_CATS}
      selectedAriaLabel="Selected"
    />
  )
}

const TeamSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addAssetFormCtx);
  const initialOption = TEAM_CATS.filter((it) => it.value === formData.team);
  const [selectedOption, setSelectedOption] = useState( initialOption?initialOption[0]:undefined );
  const value = formData.team;
  return (
    <Select
      invalid={inValid && !formData.team}
      disabled={readOnly}
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        setSelectedOption(detail.selectedOption);
        setFormData((prev) => ({
          ...prev,
          team: detail.selectedOption.value,
        }));
      }}
      options={TEAM_CATS}
      selectedAriaLabel="Selected"
    />
  )
}

const IndustryMultiSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addAssetFormCtx);
  const initialOptions = INSTRUSTRY_LIST.filter((it) => formData.industry?.includes(it.value));
   const [selectedOptions, setSelectedOptions] = useState(initialOptions);
   return (
     <Multiselect
       invalid={inValid && !formData.industry}
       disabled={readOnly}
       selectedOptions={selectedOptions}
       onChange={({ detail }) => {
         setSelectedOptions(detail.selectedOptions);
         setFormData((prev) => ({
           ...prev,
           industry: detail.selectedOptions?.map(it => (it.value)),
         }));
       }}
       options={INSTRUSTRY_LIST}
     />
   )
 }


const RegionRadio = ({ readOnly }) => {
 const { inValid, formData, setFormData } = useContext(addAssetFormCtx);
  return (
    <RadioGroup
      disabled={readOnly}
      value={formData.china_region_support}
      onChange={({ detail }) => {
        if (!readOnly) {
          setFormData((prev) => ({
            ...prev,
            china_region_support: detail.value,
          }));
        }
      }
      }
      items={[{label:'YES',value:'YES'},{label:'NO',value:'NO'}]}
  />
  )
}


export const DetailPanel = ({ readOnlyWithErrors = false, readOnly = false }) => {

  const { t } = useTranslation();
  const { formData, setFormData, inValid, setInvalid } = useContext(addAssetFormCtx);

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );

  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header variant="h3">
            {t('basic_info')}
          </Header>}
      >
        <SpaceBetween size="l">
          <FormField label={t("demo_name")}>
            <Input
              invalid={inValid && !formData.demo_name}
              placeholder="Required"
              readOnly={readOnly}
              // inputMode="email"
              value={formData.demo_name}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, demo_name: event.detail.value }))
              }
            />
          </FormField>
          <FormField label={t("description")}>
            <Textarea
              invalid={inValid && !formData.description}
              placeholder="Required"
              readOnly={readOnly}
              value={formData.description}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, description: event.detail.value }))
              }
            />
          </FormField>
          <FormField label={t("demo_type")}>
            <DemoTypeSelect readOnly={readOnly}/>
          </FormField>
          <FormField label={t("industry")}>
            <IndustryMultiSelect readOnly={readOnly}/>
          </FormField>
          <FormField label={t("category")}>
            <DemoCategorySelect readOnly={readOnly}/>
          </FormField>
          <FormField label={t("china_region_support")} 
            errorText = {inValid && !formData.china_region_support ? "required":undefined}>
              <RegionRadio readOnly={readOnly}/>
          </FormField>
          <FormField label={t("contact")}
          description={"输入email地址，如果是多个用半角逗号隔开"}>
            <Input
              invalid={inValid && !formData.contact}
              placeholder="Required"
              readOnly={readOnly}
              // inputMode="email"
              value={formData.contact}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, contact: event.detail.value }))
              }
            />
          </FormField>
          <FormField label={t("team")}>
            <TeamSelect readOnly={readOnly}/>
          </FormField>
        </SpaceBetween>
      </Container >
      <Container
        header={
          <Header variant="h3" >
            {t('main_info')}
          </Header>}
      >
        <SpaceBetween size="l">
          <FormField label={t("deck_link")}
            description={"如果是多个, 用半角逗号隔开"}
          >
            <Textarea
              invalid={inValid && !formData.deck_link}
              placeholder="Required"
              readOnly={readOnly}
              value={formData.deck_link}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, deck_link: event.detail.value }))
              }
            />
          </FormField>
          <FormField label={t("code_repo_link")}
            description={"如果是多个, 用半角逗号隔开"}
          >
            <Textarea
              invalid={inValid && !formData.code_repo_link}
              placeholder="Required"
              readOnly={readOnly}
              value={formData.code_repo_link}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, code_repo_link: event.detail.value }))
              }
            />
          </FormField>
          <FormField label={t("demo_link")}
            description={"如果是多个, 用半角逗号隔开"}
          >
            <Textarea
              invalid={inValid && !formData.demo_link}
              placeholder="Required"
              readOnly={readOnly}
              value={formData.demo_link}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, demo_link: event.detail.value }))
              }
            />
          </FormField>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}

const DeleteConfirmModal = ({ selectItem, visible, setVisible, refreshAction }) => {
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
  const deleteAction = () => {
    setLoading(true);
    const payload = {
      ...selectItem,
    };
    console.log(payload);
    deleteAsset(headers, payload)
      .then(res => {
        setNotificationItems((item) => [
          ...item,
          {
            header: t('delete_asset'),
            type: "success",
            content: t('delete_asset') + ' success',
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
            header: t("delete_asset"),
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
      {t('delete_asset') + ':' + selectItem?.demo_name}
    </Modal>
  );
};

export const CardPageHeader = ({
  resourceName,
  createButtonText,
  ...props
}) => {
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
  const isOnlyOneSelected = props.selectedItems.length === 1;
  const [visible, setVisible] = useState(false);
  const [qAModalVisible, setQAModalVisible] = useState(false);
  function handleAddFeedbackClick(event) {
    event.preventDefault();
    setQAModalVisible(true);
  }
  const deleteAction = () => {
    setVisible(true);
  }
  const selectItem = isOnlyOneSelected ? props.selectedItems[0] : undefined;
  // console.log(selectItem);
  return (
    <div>
      <CreateQAModal visible={qAModalVisible} setVisible={setQAModalVisible} selectItem={selectItem} />
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
           variant="primary"
            onClick={handleAddFeedbackClick}
          >
            {t("submit_new_feedback")}
          </Button>
          <Button
            disabled={!isOnlyOneSelected || userinfo.groupname !== 'admin'}
            href={'/asset_hub/' + selectItem?.id}
          >{t('edit')}
          </Button>
          <Button
            disabled={!isOnlyOneSelected || userinfo.groupname !== 'admin'}
            onClick={deleteAction}
          >{t('delete')}
          </Button>
          <Button
            disabled={userinfo.groupname !== 'admin'}
            href={'/asset_hub/create'}
          >{t('add')}
          </Button>
          </SpaceBetween>
        }
        {...props}
      />
    </div>
  );
};