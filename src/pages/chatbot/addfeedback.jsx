// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState,useEffect } from "react";
import {
    FormField,
    FileUpload,
    Box,
    SpaceBetween,
    Button,
    Modal,
  } from "@cloudscape-design/components";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import {params_local_storage_key} from "../chatbot/common-components";
import { useAuthUserInfo ,useAuthToken} from "../commons/use-auth";
import {useSimpleNotifications} from '../commons/use-notifications';


const SettingsPanel = ()=>{
    const { t } = useTranslation();
    const userinfo = useAuthUserInfo();
    const { setNotificationItems } = useSimpleNotifications();
    const token = useAuthToken();
    const username = userinfo?.username || 'default';
    const [localStoredParams] = useLocalStorage(
      params_local_storage_key+username,
      null
    );
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      
      }, []);

    return (
        <SpaceBetween direction="vertical" size="l">
          
        </SpaceBetween>
    );
}

const AddFeedbackModal =({visible,setVisible}) =>{
    const { t } = useTranslation();
    return (
        <Modal
          onDismiss={() => setVisible(false)}
          visible={visible}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={ ()=> setVisible(false)}>{t('cancel')}</Button>
                {/* <Button variant="primary" href = '#' onClick={ ()=> setVisible(false)}>{t('confirm')}</Button> */}
              </SpaceBetween>
            </Box>
          }
          header={t('correct_answer')}
        >
          <SettingsPanel/>
        </Modal>
      );
}

export default AddFeedbackModal;