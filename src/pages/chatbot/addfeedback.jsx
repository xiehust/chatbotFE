// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState,useEffect } from "react";
import {
    Box,
    SpaceBetween,
    Button,
    Modal,
    FormField,
    Textarea,
    Container,
    Form,
    Header
  } from "@cloudscape-design/components";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import {params_local_storage_key} from "../chatbot/common-components";
import { useAuthUserInfo ,useAuthToken} from "../commons/use-auth";
import {useSimpleNotifications} from '../commons/use-notifications';
import { useChatData } from "./common-components";
import { postFeedback } from "../commons/api-gateway";

function generateId(){
    const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
    const randomNumber = Math.random().toString(16).slice(2,8);
    return `${timestamp}-${randomNumber}`
  }

const EditPanel = ({setVisible})=>{
    const { t } = useTranslation();
    const userinfo = useAuthUserInfo();
    const {modalData} = useChatData();
    const { setNotificationItems } = useSimpleNotifications();
    const token = useAuthToken();
    const headers = {
        Authorization: token.token,
      };
    const username = userinfo?.username || 'default';
    const [localStoredParams,setLocalStoredParams] = useLocalStorage(
      params_local_storage_key+username,
      null
    );
    const [feedbackVal, setFeedbackVal] = useState(  (localStoredParams?.feedback !== undefined && localStoredParams?.feedback[modalData.msgid])?
            localStoredParams?.feedback[modalData.msgid].feedback:'');
    const [loading, setLoading] = useState(false);
    const item_msgid = generateId();
    useEffect(() => {
      
      }, []);
    // console.log(JSON.stringify(modalData));
    return (

        <form onSubmit={async e => {
            e.preventDefault();
            setLoading(true);
            const body = {
                ...modalData,
                feedback:feedbackVal,
            }
            try {
                const resp = await postFeedback(headers,body);
                setLoading(false);
                setLocalStoredParams({
                    ...localStoredParams,
                    feedback:{
                    ...localStoredParams.feedback,
                    [modalData.msgid]:body}
                });
                setVisible(false);
                setNotificationItems((item) => [
                  ...item,
                  {
                    header: t('provide_your_answer'),
                    type: "success",
                    content: t('provide_your_answer'),
                    dismissible: true,
                    dismissLabel: "Dismiss message",
                    onDismiss: () =>
                      setNotificationItems((items) =>
                        items.filter((item) => item.id !== item_msgid)
                      ),
                    id: item_msgid,
                  },
                ]);


      } catch (error) {
        console.log(error);
        setLoading(false);
      }
      
        
        }}>
        <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button formAction="none" variant="link" onClick={(event)=>{
              event.preventDefault();
              setVisible(false);
              }}>
              {t('cancel')}
            </Button>
            <Button variant="primary" loading={loading}>{t('submit')}</Button>
          </SpaceBetween>
        }
      >

        <SpaceBetween direction="vertical" size="l" key={modalData.msgid}>
          <FormField
          label={t("provide_your_answer")}
        >
          <Textarea
          placeholder="Your answer"
          spellcheck
          autoFocus
            rows={6}
            ariaRequired={true}
            value={feedbackVal}
            onChange={({detail}) =>{
              setFeedbackVal( detail.value);
              
            }
            }
          />
        </FormField>
        </SpaceBetween>
        </Form>
        </form>


    );
}

const AddFeedbackModal =({visible,setVisible}) =>{
    const { t } = useTranslation();
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
          header={t('correct_answer')}
        >
          <EditPanel setVisible={setVisible}/>
        </Modal>
      );
}

export default AddFeedbackModal;