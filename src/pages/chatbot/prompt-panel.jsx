// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState } from "react";
import {
  FormField,
  Container,
  Grid,
  Textarea,
  SpaceBetween,
  Toggle,
  Input,
  Button,
  FileUpload,
  ExpandableSection,
  Select,
  ColumnLayout,
} from "@cloudscape-design/components";

import { useChatData, generateUniqueId } from "./common-components";
import { useTranslation } from "react-i18next";
import { useAuthUserInfo, useAuthToken } from "../commons/use-auth";
import { models, embeddings } from "../../common/shared";
import { useLocalStorage } from "../../common/localStorage";
import { listTemplate, uploadS3,uploadFile } from "../commons/api-gateway";
import { params_local_storage_key } from "./common-components";

const default_bucket = process.env.REACT_APP_DEFAULT_UPLOAD_BUCKET;
export const defaultModelParams = {
  temperature: 0.1,
  max_tokens: 2000,
  model_name: models[0].value,
  model_name_opt: models[0],
  use_qa: false,
  multi_rounds:false,
  // embedding_model_name: embeddings[0].value,
  // embedding_model_name_opt: embeddings[0],
  obj_prefix: "ai-content/",
  system_role: "AWSBot",
  system_role_prompt: "你是云服务AWS的智能客服机器人",
  template_id: "default",
  template_opt: { label: "default", value: "default" },
  hide_ref: false,
};

function generateId() {
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2, 8);
  return `${timestamp}-${randomNumber}`;
}

const ExpandableSettingPanel = () => {
  const { t } = useTranslation();

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || "default";
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );
  // console.log('localStoredParams:',localStoredParams);
  const [selectedOption, setSelectedOption] = useState(
    localStoredParams?.model_name_opt || defaultModelParams.model_name_opt
  );
  // const [embselectedOption, setembSelectedOption] = useState(
  //   localStoredParams?.embedding_model_name_opt ||
  //     defaultModelParams.embedding_model_name_opt
  // );
  const [tokenSize, settokenSize] = useState(
    localStoredParams?.max_tokens || defaultModelParams.max_tokens
  );
  const [temperatureValue, setTempValue] = useState(
    localStoredParams?.temperature || defaultModelParams.temperature
  );
  const [systemRoleValue, setSystemRoleValue] = useState(
    localStoredParams?.system_role === undefined
    ? defaultModelParams.system_role
    : localStoredParams.system_role
  );
  const [systemRolePromptValue, setSystemRolePromptValue] = useState(
    localStoredParams?.system_role_prompt === undefined
          ? defaultModelParams.system_role_prompt
          : localStoredParams.system_role_prompt,
  );
  const { setMsgItems, setModelParams, setImg2txtUrl} = useChatData();
  const [alldocs, setAlldocs] = useState([]);

  const [selectTemplate, setSelectTemplate] = useState(
    localStoredParams?.template_opt || defaultModelParams.template_opt
  );
  const [loadStatus, setLoadStatus] = useState("loading");
  const [uploadErrtxt, setUploadErr] = useState();
  const [uploadComplete, setUploadComplete] = useState(false);
  const [file, setFile] = useState([]);
  const token = useAuthToken();
  const [loading, setLoading] = useState(false);
  const [helperMsg, setHelperMsg] = useState("Upload image file");
  const main_fun_arn = localStoredParams?.main_fun_arn;
  const apigateway_endpoint = localStoredParams?.apigateway_endpoint;
  const queryParams = {
    main_fun_arn: main_fun_arn,
    apigateway_endpoint: apigateway_endpoint,
  };

  const handleImageUpload = () => {
    const msgid = `image-${generateId()}`;
    setLoading(true);
    if (
      localStoredParams.ak &&
      localStoredParams.sk &&
      localStoredParams.s3_bucket &&
      localStoredParams.s3_region
    ) {
      uploadS3(
        file[0],
        localStoredParams.s3_bucket,
        `images/${username}/`,
        localStoredParams.s3_region,
        localStoredParams.ak,
        localStoredParams.sk
      )
        .then(() => {
          setLoading(false);
          setImg2txtUrl(`${localStoredParams.s3_bucket}/images/${username}/${file[0].name}`); 
          setMsgItems(
            (prev) => [
              ...prev,
              {
                id: msgid,
                who: userinfo.username,
                text: file[0].name,
                image: file[0],
              },
            ] //创建一个新的item
          );
          setUploadComplete(true);
          setFile([]);
        })
        .catch((error) => {
          console.log(error);
          setImg2txtUrl(null); 
          setLoading(false);
          setUploadErr(`Upload ${file[0].name} error`);
          setFile([]);
        });
    } else {
      console.log(`missing buckets params, using default bucket:${default_bucket} to upload`);
      setHelperMsg(`missing buckets params, using default bucket`);
      //upload to default bucket
      const formData = new FormData();
        formData.append("image", file[0]);
        console.log(file[0]);
        const headers = {
          'Authorization': token.token,
          'Content-Type':file[0].type,
          'Accept':file[0].type
        };
        uploadFile( username,formData, headers)
          .then((response) => {
            setLoading(false);
            setImg2txtUrl(`${default_bucket}/images/${username}/${file[0].name}`); 
            setMsgItems(
              (prev) => [
                ...prev,
                {
                  id: msgid,
                  who: userinfo.username,
                  text: file[0].name,
                  image: file[0],
                },
              ] //创建一个新的item
            );
            setUploadComplete(true);
            setFile([]);
          })
          .catch((error) => {
            console.log(error);
            setImg2txtUrl(null); 
            setLoading(false);
            setUploadErr(`Upload ${file[0].name} error`);
            setFile([]);
          });
      }

    
  };

  const handleLoadItems = async ({
    detail: { filteringText, firstPage, samePage },
  }) => {
    const headers = {
      Authorization: token.token,
    };
    setLoadStatus("loading");
    try {
      const data = await listTemplate(headers, queryParams);
      let items = data.body.map((it) => ({
        template_name: it.template_name.S,
        id: it.id.S,
        username: it.username.S,
      }));
      items.unshift({
        id: defaultModelParams.template_id,
        template_name: defaultModelParams.template_id,
        username: "system",
      });
      setAlldocs(items);
      setLoadStatus("finished");
    } catch (error) {
      console.log(error);
      setLoadStatus("error");
    }
  };


  useEffect(() => {
    setLocalStoredParams({
      ...localStoredParams,
      system_role:
        localStoredParams?.system_role === undefined
          ? defaultModelParams.system_role
          : localStoredParams.system_role,
      use_qa:
        localStoredParams?.use_qa === undefined
          ? defaultModelParams.use_qa
          : localStoredParams?.use_qa,
      multi_rounds:
          localStoredParams?.multi_rounds === undefined
            ? defaultModelParams.multi_rounds
            : localStoredParams?.multi_rounds,
      hide_ref:
        localStoredParams?.hide_ref === undefined
          ? defaultModelParams.hide_ref
          : localStoredParams?.hide_ref,
      system_role_prompt:
        localStoredParams?.system_role_prompt === undefined
          ? defaultModelParams.system_role_prompt
          : localStoredParams.system_role_prompt,
      obj_prefix:
        localStoredParams?.obj_prefix === undefined
          ? defaultModelParams.obj_prefix
          : localStoredParams?.obj_prefix,
    });
  }, []);

  useEffect(() => {
    setModelParams({
      ...localStoredParams,
      obj_prefix:
        localStoredParams?.obj_prefix || defaultModelParams.obj_prefix,
      max_tokens:
        localStoredParams?.max_tokens || defaultModelParams.max_tokens,
      temperature:
        localStoredParams?.temperature || defaultModelParams.temperature,
      use_qa:
        localStoredParams?.use_qa !== undefined
          ? localStoredParams?.use_qa
          : defaultModelParams.use_qa,
      multi_rounds:
          localStoredParams?.multi_rounds !== undefined
            ? localStoredParams?.multi_rounds
            : defaultModelParams.multi_rounds,
      model_name:
        localStoredParams?.model_name || defaultModelParams.model_name,
      system_role:
        localStoredParams?.system_role || defaultModelParams.system_role,
      system_role_prompt:
        localStoredParams?.system_role_prompt ||
        defaultModelParams.system_role_prompt,
      template_id:
        localStoredParams?.template_id || defaultModelParams.template_id,
      username: userinfo.username,
    });
  }, []);
  // console.log('modelParams:',modelParams);

  return (
    <ExpandableSection headerText={t("addtional_settings")} variant="footer">
      <ColumnLayout borders="vertical" columns="3" variant="text-grid">
        <FormField label={t("model_name")}>
          <Select
            selectedOption={selectedOption}
            onChange={({ detail }) => {
              setSelectedOption(detail.selectedOption);
              setModelParams((prev) => ({
                ...prev,
                model_name: detail.selectedOption.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                model_name: detail.selectedOption.value,
                model_name_opt: detail.selectedOption,
              });
            }}
            options={models}
            selectedAriaLabel="Selected"
          />
        </FormField>
        <FormField label={t("max_tokens")}>
          <Input
            onChange={({ detail }) => {
              settokenSize(detail.value);
              setModelParams((prev) => ({
                ...prev,
                max_tokens: parseInt(detail.value),
              }));
              setLocalStoredParams({
                ...localStoredParams,
                max_tokens: parseInt(detail.value),
              });
            }}
            value={tokenSize}
            inputMode="numeric"
          />
        </FormField>
        <FormField label={t("temperature")}>
          <Input
            onChange={({ detail }) => {
              setTempValue(detail.value);
              setModelParams((prev) => ({
                ...prev,
                temperature: parseFloat(detail.value),
              }));
              setLocalStoredParams({
                ...localStoredParams,
                temperature: parseFloat(detail.value),
              });
            }}
            value={temperatureValue}
            inputMode="decimal"
          />
        </FormField>

        <FormField label={t("system_role")}>
          <Input
            onChange={({ detail }) => {
              setSystemRoleValue(detail.value);
              setModelParams((prev) => ({
                ...prev,
                system_role: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                system_role: detail.value,
              });
            }}
            value={systemRoleValue}
          />
        </FormField>
        <FormField label={t("system_role_prompt")}>
          <Input
            onChange={({ detail }) => {
              setSystemRolePromptValue(detail.value);
              setModelParams((prev) => ({
                ...prev,
                system_role_prompt: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                system_role_prompt: detail.value,
              });
            }}
            value={systemRolePromptValue}
          />
        </FormField>
        <FormField label={t("prompt_template")}>
          <Select
            statusType={loadStatus}
            onLoadItems={handleLoadItems}
            selectedOption={selectTemplate}
            onChange={({ detail }) => {
              setSelectTemplate(detail.selectedOption);
              setModelParams((prev) => ({
                ...prev,
                template_id: detail.selectedOption.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                template_id: detail.selectedOption.value,
                template_opt: detail.selectedOption,
              });
            }}
            options={alldocs.map(({ template_name, id, username }) => ({
              label: `${id}/${template_name}/${username}`,
              value: id,
            }))}
            selectedAriaLabel="Selected"
          />
        </FormField>
      </ColumnLayout>
      <ColumnLayout borders="vertical" columns="2" variant="text-grid">
        <FormField label={t("upload_image")}>
          <SpaceBetween size="s" direction="horizontal">
            <FileUpload
              onChange={({ detail }) => {
                setHelperMsg("");
                setFile(detail.value);
                setUploadErr(null);
                setUploadComplete(false);
                setImg2txtUrl(null); 
              }}
              value={file}
              accept=".png,.jpg,.jpeg"
              constraintText={helperMsg}
              showFileLastModified
              showFileSize
              showFileThumbnail
              tokenLimit={3}
              errorText={uploadErrtxt}
              i18nStrings={{
                uploadButtonText: (e) =>
                  e ? t("choose_files") : t("choose_file"),
                dropzoneText: (e) =>
                  e ? "Drop files to upload" : "Drop file to upload",
                removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
                limitShowFewer: "Show fewer files",
                limitShowMore: "Show more files",
                errorIconAriaLabel: "Error",
              }}
            />
            <Button
              variant="primary"
              loading={loading}
              disabled={uploadComplete}
              onClick={handleImageUpload}
            >
              {t("upload")}
            </Button>
          </SpaceBetween>
        </FormField>
      </ColumnLayout>
    </ExpandableSection>
  );
};

const PromptPanel = ({ sendMessage }) => {
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
  const [promptValue, setPromptValue] = useState("");
  const {
    modelParams,
    setMsgItems,
    setLoading,
    setModelParams,
    conversations,
    setConversations,
    img2txtUrl,
    setImg2txtUrl
  } = useChatData();
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key + userinfo.username,
    null
  );
  const [checked, setChecked] = useState(
    localStoredParams?.use_qa !== undefined
      ? localStoredParams?.use_qa
      : defaultModelParams.use_qa
  );
  const [multiRoundsChecked, setMultiRoundsChecked] = useState(
    localStoredParams?.multi_rounds !== undefined
      ? localStoredParams?.multi_rounds
      : defaultModelParams.multi_rounds
  );

  const { setHideRefDoc } = useChatData();

  const [hideRefchecked, setRefDocChecked] = useState(
    localStoredParams?.hide_ref !== undefined
      ? localStoredParams?.hide_ref
      : defaultModelParams.hide_ref
  );
  const onSubmit = (values,imgUrl=null) => {
    const prompt = values.trimEnd();
    if (prompt === "") {
      return;
    }
    const respid = generateUniqueId();
    setMsgItems((prev) => [
      ...prev,
      { id: respid, who: userinfo.username, text: prompt },
    ]);

    setConversations((prev) => [...prev, { role: "user", content: prompt }]);
    const messages = [...conversations, { role: "user", content: prompt }];
    setLoading(true);
    const params = {...modelParams,imgurl:img2txtUrl}
    sendMessage({
      action: "sendprompt",
      payload: { msgid: respid, messages: messages, params: params },
    });
    console.log("modelParams:", params);

    setPromptValue("");
  };

  return (
    <Container footer={<ExpandableSettingPanel />}>
      <FormField
        stretch={true}
        // label={t('prompt_label')}
      >
        <Grid gridDefinition={[{ colspan: 8 }, { colspan: 2 }, { colspan: 2 }]}>
          <Textarea
            value={promptValue}
            onChange={(event) => setPromptValue(event.detail.value)}
            onKeyDown={(event) => {
              if (event.detail.key === "Enter" && event.detail.ctrlKey) {
                onSubmit(promptValue);
              }
            }}
            placeholder="Ctrl+Enter to send"
            autoFocus
            rows={3}
          />
          <SpaceBetween size="xs">
            <Button
              variant="primary"
              onClick={(event) => onSubmit(promptValue)}
            >
              {t("send")}
            </Button>
            <Button
              variant="secondary"
              onClick={(event) => {
                onSubmit("/rs");
                setImg2txtUrl(null);
                setConversations([]);
                setMsgItems([]);
                setLoading(false);
              }}
            >
              {t("clear")}
            </Button>
          </SpaceBetween>
          <SpaceBetween size="xs">
            <FormField >
              <Toggle
                onChange={({ detail }) => {
                  setChecked(detail.checked);
                  setModelParams((prev) => ({
                    ...prev,
                    use_qa: detail.checked,
                  }));
                  setLocalStoredParams({
                    ...localStoredParams,
                    use_qa: detail.checked,
                  });
                }}
                checked={checked}
              >{t("use_qa")}</Toggle>
            </FormField>
            <FormField >
              <Toggle
                onChange={({ detail }) => {
                  setMultiRoundsChecked(detail.checked);
                  setModelParams((prev) => ({
                    ...prev,
                    multi_rounds: detail.checked,
                  }));
                  setLocalStoredParams({
                    ...localStoredParams,
                    multi_rounds: detail.checked,
                  });
                }}
                checked={multiRoundsChecked}
              >{t("multi_rounds")}</Toggle>
            </FormField>
            <FormField >
              <Toggle
                onChange={({ detail }) => {
                  setRefDocChecked(detail.checked);
                  setHideRefDoc(detail.checked);
                  setLocalStoredParams({
                    ...localStoredParams,
                    hide_ref: detail.checked,
                  });
                }}
                checked={hideRefchecked}
              >{t("hide_ref_doc")}</Toggle>
            </FormField>
          </SpaceBetween>
        </Grid>
      </FormField>
    </Container>
  );
};
export default PromptPanel;
