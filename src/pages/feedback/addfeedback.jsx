// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState, useEffect } from "react";
import {
  Box,
  SpaceBetween,
  Button,
  Modal,
  FormField,
  Textarea,
  Container,
  Form,
  Header,
  Input,
} from "@cloudscape-design/components";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import { params_local_storage_key } from "../chatbot/common-components";
import { useAuthUserInfo, useAuthToken } from "../commons/use-auth";
import { useSimpleNotifications } from "../commons/use-notifications";
import { postFeedback } from "../commons/api-gateway";

function generateId() {
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2, 8);
  return `${timestamp}-${randomNumber}`;
}

const EditPanel = ({ setVisible }) => {
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
  // const {modalData} = useChatData();
  const { setNotificationItems } = useSimpleNotifications();
  const token = useAuthToken();
  const headers = {
    Authorization: token.token,
  };
  const username = userinfo?.username || "default";
  const company = userinfo?.company || "default";
  const [answerValue, setAnswerValue] = useState("");
  const [questionValue, setQuestionValue] = useState("");
  const [requesterName, setRequesterName] = useState(username);
  const [loading, setLoading] = useState(false);
  const msgid = generateId();
  useEffect(() => {
    // console.log('EditPanel');
  }, []);
  // console.log(JSON.stringify(modalData));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const body = {
          id: msgid,
          title: questionValue,
          description: answerValue,
          status: "new-added",
          username: requesterName,
          company:company,
        };
        try {
          console.log(body);
          const resp = await postFeedback(headers, body);
          setLoading(false);
          setVisible(false);
          setNotificationItems((item) => [
            ...item,
            {
              header: t("submit_new_feedback"),
              type: "success",
              content: t("submit_new_feedback"),
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
          header: t("submit_new_feedback"),
          type: "error",
          content: t("submit_new_feedback")+' Failed',
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
        }
      }}
    >
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              formAction="none"
              variant="link"
              onClick={(event) => {
                event.preventDefault();
                setVisible(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button variant="primary" loading={loading}>
              {t("submit")}
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween direction="vertical" size="l" >
          <FormField label={t("title")}>
            <Input
              placeholder="Title"
              autoFocus
              value={questionValue}
              onChange={({ detail }) => {
                setQuestionValue(detail.value);
              }}
            />
          </FormField>
          <FormField label={t("description")}>
            <Textarea
              placeholder="Put your desciption"
              rows={6}  
              value={answerValue}
              onChange={({ detail }) => {
                setAnswerValue(detail.value);
              }}
            />
          </FormField>
          <FormField label={t("requester_name")}
          description='Put your name or email here'
          >
            <Input
              placeholder="your name or email here"
              value={requesterName}
              onChange={({ detail }) => {
                setRequesterName(detail.value);
              }}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </form>
  );
};

const CreateQAModal = ({ visible, setVisible }) => {
  const { t } = useTranslation();
  useEffect(() => {
    // console.log('CreateQAModal');
  }, []);
  return (
    <Modal
      onDismiss={() => setVisible(false)}
      visible={visible}
      //   footer={
      //     <Box float="right">
      //       <SpaceBetween direction="horizontal" size="xs">
      //         <Button variant="link" onClick={ ()=> setVisible(false)}>{t('cancel')}</Button>
      //         {/* <Button variant="primary" href = '#' onClick={ ()=> setVisible(false)}>{t('confirm')}</Button> */}
      //       </SpaceBetween>
      //     </Box>
      //   }
      header={t("submit_new_feedback")}
    >
      <EditPanel setVisible={setVisible} />
    </Modal>
  );
};

export default CreateQAModal;
