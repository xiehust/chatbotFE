// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState, useEffect ,useRef} from "react";
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

const validateEmpty = (value) => Boolean(value && value.length > 0);

//add validate for email address @amazon
const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@amazon\.com$/;
  return emailRegex.test(value);
}
const validationConfig = {
  title: [{ validate: validateEmpty, errorText: 'title is required.' }],
  description: [{ validate: validateEmpty, errorText: 'description is required.' }],
  username: [{ validate: validateEmail, errorText: '@amazon.com email is required.' }],
};

function validateField(attribute, value , customValue = value) {
  const validations = validationConfig[attribute];
  // console.log('validations', attribute,validations);
  if(validations){
    for (const validation of validations) {
      const { validate, errorText, warningText } = validation;
  
      const isValid = validate(value);
      if (!isValid) {
        return {
          errorText: typeof errorText === 'function' ? errorText(customValue) : errorText,
          warningText: typeof warningText === 'function' ? warningText(customValue) : warningText,
        };
      }
    }
  }
  return { errorText: null };
}

const defaultErrors = {
  title: null,
  description: null,
  username: null,
};

const fieldsToValidate = [
  // 'title',
  'description',
  'username'
];

const EditPanel = ({ setVisible,selectItem }) => {
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
  const [formErrorText, setFormErrorText] = useState(null);
  const [errors, _setErrors] = useState(defaultErrors);
  const { setNotificationItems } = useSimpleNotifications();
  const token = useAuthToken();
  const headers = {
    Authorization: token.token,
  };
  const username = userinfo?.username || "default";
  const company = userinfo?.company || "default";
  const [answerValue, setAnswerValue] = useState("");
  const [questionValue, setQuestionValue] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [loading, setLoading] = useState(false);
  const msgid = generateId();
  const setErrors = (updateObj = {}) => _setErrors(prevErrors => ({ ...prevErrors, ...updateObj }));
  const recordId = selectItem&&selectItem?.id;
  const demoName = selectItem&&selectItem?.demo_name;
  // const contact = selectItem&&selectItem?.contact;

  const refs = {
    title: useRef(null),
    description: useRef(null),
    username: useRef(null),
  }

  const shouldFocus = (errorsState, attribute) => {
    let shouldFocus = errorsState[attribute]?.length > 0;

    if (attribute === 'functions' && !shouldFocus) {
      shouldFocus = errorsState.functionFiles?.length > 0;
    }

    return shouldFocus;
  };

  const focusTopMostError = errorsState => {
    for (const [attribute, ref] of Object.entries(refs)) {
      if (shouldFocus(errorsState, attribute)) {
        if (ref.current?.focus) {
          return ref.current.focus();
        }

        if (ref.current?.focusAddButton) {
          return ref.current.focusAddButton();
        }
      }
    }
  };

  const onChangeValidate = (attribute, value) => {
    // Validates when there is an error message in the field
    if (errors[attribute]?.length > 0) {
      const { errorText } = validateField(attribute, value);
      setErrors({ [attribute]: errorText });
    }
  };
  
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const body = {
          id: msgid,
          record_id:recordId,
          title:`[Feedback]:${demoName}` ,
          description: answerValue,
          status: "new-added",
          username: requesterName,
          company:company,
        };

        const newErrors = { ...errors };
        let validatePass = true;
        fieldsToValidate.forEach(attribute => {
          const { errorText } = validateField(attribute, body[attribute], body[attribute]);
          newErrors[attribute] = errorText;
          if (errorText) {
            console.log(errorText);
            validatePass = false;
          }
        });
        if (!validatePass) {
          setErrors(newErrors);
          focusTopMostError(newErrors);
          setLoading(false);
          return
        }


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
          {demoName&&<FormField label={t('demo_name')}>
                    <Input
                      autoFocus
                      value={demoName}
                      disabled
                    />
                  </FormField>
          }
          {/* <FormField label={t("title")}
            errorText={errors.title}
          >
            <Input
              placeholder="Title"
              autoFocus
              value={questionValue}
              ref={refs.title}
              onChange={({ detail }) => {
                setQuestionValue(detail.value);
                onChangeValidate('title', detail.value);
              }}
            />
          </FormField> */}
          <FormField label={t("description")}
          errorText={errors.description}
          >
            <Textarea
              placeholder="提供需求反馈，请提供客户相关信息, 如客户名,OPP大小等"
              rows={6}  
              ref={refs.description}
              value={answerValue}
              onChange={({ detail }) => {
                setAnswerValue(detail.value);
                onChangeValidate('description', detail.value);
              }}
            />
          </FormField>
          <FormField label={t("requester_name")}
          description='Put your email here'
          errorText={errors.username}
          >
            <Input
              placeholder="your email: xxx@amazon"
              ref={refs.username}
              value={requesterName}
              onChange={({ detail }) => {
                setRequesterName(detail.value);
                onChangeValidate('username', detail.value)
              }}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </form>
  );
};

const CreateQAModal = ({ visible, setVisible,selectItem=undefined }) => {
  const { t } = useTranslation();
  // console.log(selectItem)
  return (
    <Modal
      onDismiss={() => setVisible(false)}
      visible={visible}
      header={t("submit_new_feedback")}
    >
      <EditPanel setVisible={setVisible} selectItem={selectItem}/>
    </Modal>
  );
};

export default CreateQAModal;
